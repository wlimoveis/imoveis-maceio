// js/modules/media/media-unified.js - VERSÃO REFATORADA (CORE ESSENCIAL)
// ✅ REMOVIDAS funções de UI não essenciais (migradas para Support System)
// ✅ MANTIDAS apenas funções CRÍTICAS: upload, delete, save, state management
// Versão: 2.0.2 - Core com re-renderização forçada para garantir preview
console.log('🔄 media-unified.js - VERSÃO CORE (UI migrada para Support System)');

// ========== SUPABASE CONSTANTS ==========
if (typeof window.SUPABASE_CONSTANTS === 'undefined') {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://wxdiowpswepsvklumgvx.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGlvd3Bzd2Vwc3ZrbHVtZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTExNzksImV4cCI6MjA4Nzk4NzE3OX0.QsUHE_w5m5-pz3LcwdREuwmwvCiX3Hz8FYv8SAwhD6U',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
}

const MediaSystem = {
    // ========== CONFIGURAÇÃO ==========
    config: {
        currentSystem: 'vendas',
        buckets: {
            vendas: 'properties',
            aluguel: 'rentals'
        },
        limits: {
            maxFiles: 10,
            maxSize: 5 * 1024 * 1024,
            maxPdfs: 5,
            maxPdfSize: 10 * 1024 * 1024
        },
        allowedTypes: {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videos: ['video/mp4', 'video/quicktime'],
            pdfs: ['application/pdf']
        }
    },

    // ========== ESTADO ==========
    state: {
        files: [],           // Arquivos NOVOS (não enviados)
        existing: [],        // Arquivos EXISTENTES (já no banco)
        pdfs: [],            // PDFs NOVOS
        existingPdfs: [],    // PDFs EXISTENTES
        isUploading: false,
        currentPropertyId: null,
        lastUploadResult: null
    },

    // ========== INICIALIZAÇÃO ==========
    init(systemName = 'vendas') {
        console.log(`🔧 Inicializando sistema de mídia para: ${systemName}`);
        this.config.currentSystem = systemName;
        this.resetState();
        this.setupEventListeners();
        
        // Tentar usar Support System para UI avançada
        setTimeout(() => {
            if (window.SupportMediaUI?.setupDragAndDrop) {
                window.SupportMediaUI.setupDragAndDrop();
                console.log('🎨 UI avançada carregada via SupportMediaUI');
            } else if (window.location.search.includes('debug=true')) {
                console.log('ℹ️ SupportMediaUI não disponível - UI básica apenas');
            }
        }, 500);
        
        return this;
    },

    // ========== CARREGAR ARQUIVOS EXISTENTES ==========
    loadExisting: function(property) {
        if (!property) return this;
        
        console.log(`📥 Carregando mídia existente para imóvel ${property.id}`);
        this.state.currentPropertyId = property.id;
        
        this.state.existing = [];
        this.state.existingPdfs = [];
        
        // Carregar imagens/vídeos EXISTENTES
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📸 ${imageUrls.length} URL(s) de imagem encontrada(s)`);
            
            this.state.existing = imageUrls.map((url, index) => {
                let finalUrl = url;
                if (!url.startsWith('http') && !url.startsWith('blob:')) {
                    finalUrl = this.reconstructSupabaseUrl(url) || url;
                }
                
                const isVideo = this.isVideoUrl(finalUrl);
                
                return {
                    url: finalUrl,
                    preview: finalUrl,
                    id: `existing_img_${property.id}_${index}`,
                    name: this.extractFileName(url),
                    type: this.getFileTypeFromUrl(url),
                    isExisting: true,
                    markedForDeletion: false,
                    isNew: false,
                    isVideo: isVideo
                };
            });
        }
        
        // Carregar PDFs EXISTENTES
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            console.log(`📄 ${pdfUrls.length} URL(s) de PDF encontrada(s)`);
            
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false,
                type: 'application/pdf'
            }));
        }
        
        console.log(`📊 Estado carregado: ${this.state.existing.length} imagem(ns)/vídeo(s), ${this.state.existingPdfs.length} PDF(s)`);
        
        // CRÍTICO: Forçar múltiplas atualizações para garantir renderização
        this.updateUI();
        
        // Garantir que o DOM tenha tempo de processar a primeira atualização
        setTimeout(() => {
            this.updateUI();
            console.log('🔄 Re-renderização forçada após loadExisting');
        }, 100);
        
        // Segunda garantia para PDFs
        setTimeout(() => {
            this.updateUI();
            console.log('🔄 Segunda re-renderização forçada');
        }, 300);
        
        return this;
    },

    // ========== FUNÇÃO AUXILIAR PARA DETECTAR VÍDEO ==========
    isVideoUrl: function(url) {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return urlLower.includes('.mp4') || 
               urlLower.includes('.mov') || 
               urlLower.includes('.webm') || 
               urlLower.includes('.avi') ||
               urlLower.includes('video/');
    },

    // ========== ADICIONAR NOVOS ARQUIVOS ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            const isImage = this.config.allowedTypes.images.includes(file.type);
            const isVideo = this.config.allowedTypes.videos.includes(file.type);
            
            if (!isImage && !isVideo) {
                alert(`❌ "${file.name}" - Tipo não suportado! Apenas imagens e vídeos.`);
                return;
            }
            
            if (file.size > this.config.limits.maxSize) {
                alert(`❌ "${file.name}" - Arquivo muito grande! Máximo: 5MB`);
                return;
            }
            
            const blobUrl = URL.createObjectURL(file);
            
            const newItem = {
                file: file,
                id: `new_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                preview: blobUrl,
                isImage: isImage,
                isVideo: isVideo,
                isNew: true,
                uploaded: false,
                uploadedUrl: null,
                blobUrl: blobUrl
            };
            
            this.state.files.push(newItem);
            addedCount++;
        });
        
        this.updateUI();
        return addedCount;
    },

    // ========== UPLOAD COMPLETO ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            console.warn('⚠️ Upload já em andamento');
            return { 
                success: false, 
                images: '', 
                pdfs: '', 
                uploadedCount: 0,
                error: 'Upload em andamento' 
            };
        }
        
        this.state.isUploading = true;
        console.group('🚀 EXECUTANDO UPLOAD COMPLETO');
        
        try {
            const newFiles = this.state.files.filter(item => {
                return item.isNew === true && item.file instanceof File && !item.uploaded;
            });
            
            await this.processDeletions();
            
            const uploadedImageUrls = [];
            
            if (newFiles.length > 0) {
                for (let i = 0; i < newFiles.length; i++) {
                    const fileItem = newFiles[i];
                    const file = fileItem.file;
                    
                    try {
                        const uploadedUrl = await this.uploadSingleFile(file, propertyId, 'media');
                        
                        if (uploadedUrl) {
                            fileItem.uploadedUrl = uploadedUrl;
                            fileItem.uploaded = true;
                            fileItem.isNew = false;
                            
                            if (fileItem.preview && fileItem.preview.startsWith('blob:')) {
                                URL.revokeObjectURL(fileItem.preview);
                                fileItem.preview = uploadedUrl;
                            }
                            
                            uploadedImageUrls.push(uploadedUrl);
                        }
                    } catch (error) {
                        console.error(`❌ Erro ao enviar "${fileItem.name}":`, error);
                    }
                }
            }
            
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            const uploadedPdfUrls = [];
            
            if (newPdfs.length > 0) {
                for (let i = 0; i < newPdfs.length; i++) {
                    const pdfItem = newPdfs[i];
                    const file = pdfItem.file;
                    
                    try {
                        const uploadedUrl = await this.uploadSingleFile(file, propertyId, 'pdf');
                        
                        if (uploadedUrl) {
                            pdfItem.uploadedUrl = uploadedUrl;
                            pdfItem.uploaded = true;
                            pdfItem.isNew = false;
                            uploadedPdfUrls.push(uploadedUrl);
                        }
                    } catch (error) {
                        console.error(`❌ Erro ao enviar PDF "${pdfItem.name}":`, error);
                    }
                }
            }
            
            const existingImageUrls = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const existingPdfUrls = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const allImageUrls = [...uploadedImageUrls, ...existingImageUrls];
            const allPdfUrls = [...uploadedPdfUrls, ...existingPdfUrls];
            
            const result = {
                success: true,
                images: allImageUrls.join(','),
                pdfs: allPdfUrls.join(','),
                uploadedCount: uploadedImageUrls.length + uploadedPdfUrls.length
            };
            
            this.state.lastUploadResult = result;
            this.updateUI();
            
            return result;
            
        } catch (error) {
            console.error('❌ ERRO NO UPLOAD:', error);
            return { 
                success: false, 
                images: '', 
                pdfs: '', 
                uploadedCount: 0,
                error: error.message 
            };
        } finally {
            this.state.isUploading = false;
            console.groupEnd();
        }
    },

    // ========== UPLOAD DE ARQUIVO ÚNICO ==========
    async uploadSingleFile(file, propertyId, type = 'media') {
        return new Promise(async (resolve, reject) => {
            try {
                const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
                const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
                const bucket = this.config.buckets[this.config.currentSystem];
                
                const timestamp = Date.now();
                const random = Math.random().toString(36).substring(2, 10);
                const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
                const prefix = type === 'pdf' ? 'pdf' : 'media';
                const fileName = `${prefix}_${propertyId}_${timestamp}_${random}_${safeName}`;
                const filePath = `${bucket}/${fileName}`;
                
                const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${filePath}`;
                
                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${SUPABASE_KEY}`,
                        'apikey': SUPABASE_KEY,
                        'Content-Type': file.type || 'application/octet-stream'
                    },
                    body: file
                });
                
                if (response.ok) {
                    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${filePath}`;
                    resolve(publicUrl);
                } else {
                    const errorText = await response.text();
                    reject(new Error(`Upload falhou: ${response.status}`));
                }
                
            } catch (error) {
                reject(error);
            }
        });
    },

    // ========== EXCLUSÃO FÍSICA DE ARQUIVO ÚNICO ==========
    async deleteFileFromStorage(fileUrl) {
        if (!fileUrl) {
            return { success: false, error: 'No URL provided' };
        }

        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
            const bucket = this.config.buckets[this.config.currentSystem];
            
            const publicPathPattern = `/storage/v1/object/public/${bucket}/`;
            const pathIndex = fileUrl.indexOf(publicPathPattern);
            let filePath = null;

            if (pathIndex !== -1) {
                filePath = fileUrl.substring(pathIndex + publicPathPattern.length);
                filePath = filePath.split('?')[0];
            } else {
                const urlParts = fileUrl.split('/');
                const fileName = urlParts[urlParts.length - 1].split('?')[0];
                if (fileName && fileName.includes('_')) {
                    filePath = fileName;
                } else {
                    return { success: false, error: 'Could not extract file path from URL' };
                }
            }

            if (!filePath) {
                return { success: false, error: 'Empty file path' };
            }

            try {
                filePath = decodeURIComponent(filePath);
            } catch (e) {}

            const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'apikey': SUPABASE_KEY
                }
            });

            if (response.ok) {
                return { success: true, deletedUrl: fileUrl, filePath: filePath };
            } else {
                let errorText = '';
                try { errorText = await response.text(); } catch(e) {}
                return { success: false, error: `HTTP ${response.status}` };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    // ========== EXCLUSÃO FÍSICA DE MÚLTIPLOS ARQUIVOS ==========
    async deleteFilesFromStorage(urls) {
        if (!urls || urls.length === 0) {
            return { success: true, deletedCount: 0, failedCount: 0 };
        }

        let deletedCount = 0;
        let failedCount = 0;
        const errors = [];

        for (let i = 0; i < urls.length; i++) {
            const result = await this.deleteFileFromStorage(urls[i]);
            
            if (result.success) {
                deletedCount++;
            } else {
                failedCount++;
                errors.push({ url: urls[i], error: result.error });
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { 
            success: failedCount === 0, 
            deletedCount, 
            failedCount,
            errors: errors.length > 0 ? errors : undefined
        };
    },

    // ========== FUNÇÃO SIMPLIFICADA PARA ADMIN.JS ==========
    getOrderedMediaUrls: function() {
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        const imageUrls = allMedia.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url) return item.url;
            return null;
        }).filter(url => url !== null);
        
        const pdfUrls = allPdfs.map(item => {
            if (item.uploadedUrl) return item.uploadedUrl;
            if (item.url) return item.url;
            return null;
        }).filter(url => url !== null);
        
        return {
            images: imageUrls.join(','),
            pdfs: pdfUrls.join(',')
        };
    },

    // ========== FUNÇÃO PARA SALVAR LOCALMENTE (FALLBACK) ==========
    saveAndKeepLocal: function(propertyId, propertyTitle) {
        console.log(`💾 Salvando localmente para ${propertyId}`);
        
        const urls = this.getOrderedMediaUrls();
        
        this.state.files.forEach(item => {
            if (item.isNew && !item.uploaded) {
                item.uploaded = true;
                item.isNew = false;
                item.uploadedUrl = item.preview;
            }
        });
        
        this.state.pdfs.forEach(pdf => {
            if (pdf.isNew && !pdf.uploaded) {
                pdf.uploaded = true;
                pdf.isNew = false;
            }
        });
        
        this.updateUI();
        return urls;
    },

    // ========== ADICIONAR PDFs ==========
    addPdfs: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        
        const filesArray = Array.from(fileList);
        let addedCount = 0;
        
        filesArray.forEach(file => {
            if (!this.config.allowedTypes.pdfs.includes(file.type)) {
                alert(`❌ "${file.name}" - Não é um PDF válido!`);
                return;
            }
            
            if (file.size > this.config.limits.maxPdfSize) {
                alert(`❌ "${file.name}" - PDF muito grande! Máximo: 10MB`);
                return;
            }
            
            this.state.pdfs.push({
                file: file,
                id: `pdf_${Date.now()}_${Math.random()}`,
                name: file.name,
                isNew: true,
                uploaded: false,
                uploadedUrl: null
            });
            addedCount++;
        });
        
        this.updateUI();
        return addedCount;
    },

    // ========== REMOVER ARQUIVO ==========
    removeFile: function(fileId) {
        const searchInArray = (array) => {
            const index = array.findIndex(item => item.id === fileId);
            if (index !== -1) {
                const removed = array[index];
                
                if (removed.isExisting) {
                    removed.markedForDeletion = true;
                } else {
                    if (removed.preview && removed.preview.startsWith('blob:')) {
                        URL.revokeObjectURL(removed.preview);
                    }
                    array.splice(index, 1);
                }
                return true;
            }
            return false;
        };
        
        if (searchInArray(this.state.files)) return true;
        if (searchInArray(this.state.existing)) return true;
        if (searchInArray(this.state.pdfs)) return true;
        if (searchInArray(this.state.existingPdfs)) return true;
        
        return false;
    },

    // ========== PROCESSAR EXCLUSÕES ==========
    async processDeletions() {
        const imagesToDelete = this.state.existing.filter(item => item.markedForDeletion);
        const pdfsToDelete = this.state.existingPdfs.filter(item => item.markedForDeletion);
        
        if (imagesToDelete.length > 0 || pdfsToDelete.length > 0) {
            this.state.existing = this.state.existing.filter(item => !item.markedForDeletion);
            this.state.existingPdfs = this.state.existingPdfs.filter(item => !item.markedForDeletion);
        }
        
        return { imagesToDelete: imagesToDelete.length, pdfsToDelete: pdfsToDelete.length };
    },

    // ========== UI PROXY (delega para Support quando disponível) ==========
    updateUI: function() {
        // Prioridade máxima para SupportMediaUI (sempre que disponível)
        if (window.SupportMediaUI && typeof window.SupportMediaUI.updateUI === 'function') {
            window.SupportMediaUI.updateUI.call(this);
            return;
        }
        
        // Fallback de emergência (caso Support não esteja disponível)
        if (this.renderMediaPreview && this.renderPdfPreview) {
            if (this._updateTimeout) clearTimeout(this._updateTimeout);
            this._updateTimeout = setTimeout(() => {
                this.renderMediaPreview();
                this.renderPdfPreview();
            }, 50);
        } else if (window.location.search.includes('debug=true')) {
            console.warn('⚠️ updateUI: Nenhum renderizador disponível');
        }
    },

    // Métodos de fallback (minimalistas, apenas para garantir funcionamento)
    renderMediaPreview: function() {
        const container = document.getElementById('uploadPreview');
        if (!container) return;
        
        const totalFiles = (this.state.existing?.length || 0) + (this.state.files?.length || 0);
        
        if (totalFiles === 0) {
            container.innerHTML = '<div style="text-align:center;color:#95a5a6;padding:2rem;"><i class="fas fa-images" style="font-size:2rem;margin-bottom:1rem;opacity:0.5;"></i><p>Nenhuma foto ou vídeo</p></div>';
            return;
        }
        
        // Fallback simples: lista textual
        let html = '<div style="background:#f8f9fa;padding:1rem;border-radius:8px;">';
        html += `<strong>📸 Total: ${totalFiles} arquivo(s)</strong><br>`;
        
        [...(this.state.existing || []), ...(this.state.files || [])].forEach((item, idx) => {
            const name = item.name || 'Arquivo';
            const isExisting = item.isExisting ? '(existente)' : '(novo)';
            html += `<div style="font-size:0.8rem;margin:5px 0;">${idx+1}. ${name} ${isExisting}</div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    renderPdfPreview: function() {
        const container = document.getElementById('pdfUploadPreview');
        if (!container) return;
        
        const totalPdfs = (this.state.existingPdfs?.length || 0) + (this.state.pdfs?.length || 0);
        
        if (totalPdfs === 0) {
            container.innerHTML = '<div style="text-align:center;color:#95a5a6;padding:1rem;"><i class="fas fa-file-pdf" style="font-size:1.5rem;margin-bottom:0.5rem;opacity:0.5;"></i><p>Nenhum PDF</p></div>';
            return;
        }
        
        let html = '<div style="background:#f8f9fa;padding:1rem;border-radius:8px;">';
        html += `<strong>📄 Total: ${totalPdfs} PDF(s)</strong><br>`;
        
        [...(this.state.existingPdfs || []), ...(this.state.pdfs || [])].forEach((pdf, idx) => {
            const name = pdf.name || 'PDF';
            const isExisting = pdf.isExisting ? '(existente)' : '(novo)';
            html += `<div style="font-size:0.8rem;margin:5px 0;">${idx+1}. ${name} ${isExisting}</div>`;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ========== SETUP EVENT LISTENERS ==========
    setupEventListeners: function() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#3498db';
                uploadArea.style.background = '#e8f4fc';
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#fafafa';
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#fafafa';
                
                if (e.dataTransfer.files.length > 0) {
                    this.addFiles(e.dataTransfer.files);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addFiles(e.target.files);
                    e.target.value = '';
                }
            });
        }
        
        const pdfUploadArea = document.getElementById('pdfUploadArea');
        const pdfFileInput = document.getElementById('pdfFileInput');
        
        if (pdfUploadArea && pdfFileInput) {
            pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
            
            pdfFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addPdfs(e.target.files);
                    e.target.value = '';
                }
            });
        }
    },

    // ========== FUNÇÕES DE COMPATIBILIDADE ==========
    processAndSavePdfs: async function(propertyId, propertyTitle) {
        const result = await this.uploadAll(propertyId, propertyTitle);
        return result.pdfs;
    },

    getMediaUrlsForProperty: async function(propertyId, propertyTitle) {
        const result = await this.uploadAll(propertyId, propertyTitle);
        return result.images;
    },

    getPdfsToSave: async function(propertyId) {
        const result = await this.uploadAll(propertyId, 'Imóvel');
        return result.pdfs;
    },

    loadExistingPdfsForEdit: function(property) {
        if (!property) return this;
        
        this.state.existingPdfs = [];
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            const pdfUrls = property.pdfs.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
            this.state.existingPdfs = pdfUrls.map((url, index) => ({
                url: url,
                id: `existing_pdf_${property.id}_${index}`,
                name: this.extractFileName(url),
                isExisting: true,
                markedForDeletion: false,
                type: 'application/pdf'
            }));
        }
        
        this.updateUI();
        return this;
    },

    clearAllPdfs: function() {
        this.state.pdfs.forEach(pdf => {
            if (pdf.preview && pdf.preview.startsWith('blob:')) {
                URL.revokeObjectURL(pdf.preview);
            }
        });
        
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        this.updateUI();
        return this;
    },

    clearAllMedia: function() {
        return this.resetState();
    },

    ensurePermanentUrls: function() {
        this.state.files.forEach(item => {
            if (item.uploaded && item.uploadedUrl && item.preview && item.preview.startsWith('blob:')) {
                URL.revokeObjectURL(item.preview);
                item.preview = item.uploadedUrl;
            }
        });
        
        this.updateUI();
        return this;
    },

    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'arquivo';
        
        try {
            const urlWithoutQuery = url.split('?')[0];
            const parts = urlWithoutQuery.split('/');
            let fileName = parts[parts.length - 1] || 'arquivo';
            
            try {
                fileName = decodeURIComponent(fileName);
            } catch (e) {}
            
            if (fileName.length > 50) {
                fileName = fileName.substring(0, 47) + '...';
            }
            
            return fileName;
        } catch {
            return 'arquivo';
        }
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        if (filename.startsWith('http')) return filename;
        if (!filename.includes('.')) return null;
        
        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const bucket = this.config.buckets[this.config.currentSystem];
            return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
        } catch (error) {
            return null;
        }
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'image/jpeg';
        
        const urlLower = url.toLowerCase();
        
        if (urlLower.includes('.mp4') || urlLower.includes('.mov') || 
            urlLower.includes('.webm') || urlLower.includes('.avi') ||
            urlLower.includes('video/')) {
            return 'video/mp4';
        }
        
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || 
            urlLower.includes('.png') || urlLower.includes('.gif') || 
            urlLower.includes('.webp') || urlLower.includes('image/')) {
            return 'image/jpeg';
        }
        
        if (urlLower.includes('.pdf') || urlLower.includes('application/pdf')) {
            return 'application/pdf';
        }
        
        return 'image/jpeg';
    },

    resetState: function() {
        const cleanupBlobUrls = (items) => {
            items.forEach(item => {
                if (item.preview && item.preview.startsWith('blob:')) {
                    URL.revokeObjectURL(item.preview);
                }
                if (item.blobUrl) {
                    URL.revokeObjectURL(item.blobUrl);
                }
            });
        };
        
        cleanupBlobUrls(this.state.files);
        cleanupBlobUrls(this.state.pdfs);
        
        this.state.files = [];
        this.state.existing = [];
        this.state.pdfs = [];
        this.state.existingPdfs = [];
        this.state.isUploading = false;
        this.state.currentPropertyId = null;
        this.state.lastUploadResult = null;
        
        return this;
    }
};

// ========== EXPORTAR PARA WINDOW ==========
window.MediaSystem = MediaSystem;

// ========== INICIALIZAÇÃO AUTOMÁTICA ==========
setTimeout(() => {
    window.MediaSystem.init('vendas');
    console.log('✅ Sistema de mídia CORE pronto (UI delegada para Support quando disponível)');
}, 1000);

console.log('✅ media-unified.js CORE carregado - ' + Object.keys(MediaSystem).length + ' métodos disponíveis');
