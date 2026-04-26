// js/modules/media/media-unified.js - VERSÃO CORE OTIMIZADA (COM FALLBACK COMPLETO + DRAG & DROP)
// ✅ Mantém apenas lógica ESSENCIAL (upload, delete, estado)
// ✅ UI completa (previews, drag & drop) migrada para Support System
// ✅ Fallback COMPLETO garante previews visuais E DRAG & DROP mesmo sem Support System

console.log('🔄 media-unified.js - Core System (lógica essencial + fallback completo com drag & drop)');

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

    // ========== ESTADO BÁSICO ==========
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
        
        // Tentar configurar UI via Support System (se disponível em debug)
        setTimeout(() => {
            if (window.SupportUI?.setupEventListeners) {
                window.SupportUI.setupEventListeners(this);
            } else {
                // Fallback: configurar apenas eventos básicos
                this.setupBasicEventListeners();
            }
        }, 500);
        
        return this;
    },

    // ========== EVENT LISTENERS BÁSICOS (FALLBACK) ==========
    setupBasicEventListeners() {
        // Apenas o essencial para upload funcionar
        const fileInput = document.getElementById('fileInput');
        if (fileInput && !fileInput.hasAttribute('data-listener')) {
            fileInput.setAttribute('data-listener', 'true');
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addFiles(e.target.files);
                    e.target.value = '';
                }
            });
        }
        
        const pdfFileInput = document.getElementById('pdfFileInput');
        if (pdfFileInput && !pdfFileInput.hasAttribute('data-listener')) {
            pdfFileInput.setAttribute('data-listener', 'true');
            pdfFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.addPdfs(e.target.files);
                    e.target.value = '';
                }
            });
        }
    },

    // ========== CARREGAR ARQUIVOS EXISTENTES ==========
    loadExisting: function(property) {
        if (!property) return this;
        
        console.log(`📥 Carregando mídia existente para imóvel ${property.id}`);
        this.state.currentPropertyId = property.id;
        
        // Limpar arrays
        this.state.existing = [];
        this.state.existingPdfs = [];
        
        // 1. Carregar imagens/vídeos EXISTENTES
        if (property.images && property.images !== 'EMPTY') {
            const imageUrls = property.images.split(',')
                .map(url => url.trim())
                .filter(url => url && url !== 'EMPTY');
            
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
        
        // 2. Carregar PDFs EXISTENTES
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
        
        // ✅ FORÇAR UPDATE UI APÓS CARREGAR DADOS
        this.updateUI();
        
        console.log(`📊 Estado carregado: ${this.state.existing.length} imagem(ns)/vídeo(s), ${this.state.existingPdfs.length} PDF(s)`);
        return this;
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
                id: `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // ========== UPLOAD COMPLETO ==========
    async uploadAll(propertyId, propertyTitle) {
        if (this.state.isUploading) {
            return { 
                success: false, 
                images: '', 
                pdfs: '', 
                uploadedCount: 0,
                error: 'Upload em andamento' 
            };
        }
        
        this.state.isUploading = true;
        
        try {
            // Verificar arquivos novos
            const newFiles = this.state.files.filter(item => {
                return item.isNew === true && item.file instanceof File && !item.uploaded;
            });
            
            // Processar exclusões
            await this.processDeletions();
            
            // Upload de novos arquivos
            const uploadedImageUrls = [];
            
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
            
            // Upload de novos PDFs
            const newPdfs = this.state.pdfs.filter(pdf => pdf.isNew && pdf.file && !pdf.uploaded);
            const uploadedPdfUrls = [];
            
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
            
            // Coletar URLs existentes
            const existingImageUrls = this.state.existing
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            const existingPdfUrls = this.state.existingPdfs
                .filter(item => !item.markedForDeletion && item.url)
                .map(item => item.url);
            
            // Combinar URLs
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
        }
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
                    return { success: false, error: 'Could not extract file path' };
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
                try {
                    errorText = await response.text();
                } catch(e) {}
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

        for (let i = 0; i < urls.length; i++) {
            const result = await this.deleteFileFromStorage(urls[i]);
            
            if (result.success) {
                deletedCount++;
            } else {
                failedCount++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { success: failedCount === 0, deletedCount, failedCount };
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

    // ========== FUNÇÃO PARA SALVAR LOCALMENTE (FALLBACK) ==========
    saveAndKeepLocal: function(propertyId, propertyTitle) {
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        const imageUrls = allMedia.map(item => item.uploadedUrl || item.url || item.preview)
            .filter(url => url !== null);
        
        const pdfUrls = allPdfs.map(item => item.uploadedUrl || item.url)
            .filter(url => url !== null);
        
        // Marcar arquivos novos como "salvos localmente"
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
        
        return {
            images: imageUrls.join(','),
            pdfs: pdfUrls.join(',')
        };
    },

    // ========== FUNÇÃO PARA OBTER URLs ORDENADAS ==========
    getOrderedMediaUrls: function() {
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        const imageUrls = allMedia.map(item => item.uploadedUrl || item.url)
            .filter(url => url !== null && url !== undefined);
        
        const pdfUrls = allPdfs.map(item => item.uploadedUrl || item.url)
            .filter(url => url !== null && url !== undefined);
        
        return {
            images: imageUrls.join(','),
            pdfs: pdfUrls.join(',')
        };
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

    isVideoUrl: function(url) {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return urlLower.includes('.mp4') || urlLower.includes('.mov') || 
               urlLower.includes('.webm') || urlLower.includes('.avi') ||
               urlLower.includes('video/');
    },

    // ========== UI DELEGATION (USA SUPPORT SYSTEM SE DISPONÍVEL) ==========
    updateUI: function() {
        console.log('🔄 [MediaSystem] updateUI chamado');
        
        if (window.SupportUI && typeof window.SupportUI.renderMediaPreview === 'function') {
            console.log('🎨 [MediaSystem] Usando SupportUI para renderizar previews');
            window.SupportUI.renderMediaPreview(this);
            window.SupportUI.renderPdfPreview(this);
        } else {
            console.log('⚠️ [MediaSystem] SupportUI não disponível, usando fallback completo com drag & drop');
            // ✅ FALLBACK COMPLETO - Renderiza previews sem Support System
            this.renderMediaPreviewFallback();
            this.renderPdfPreviewFallback();
        }
    },

    // ========== FALLBACK PARA PREVIEW DE MÍDIA (COM DRAG & DROP) ==========
    renderMediaPreviewFallback: function() {
        const container = document.getElementById('uploadPreview');
        if (!container) {
            console.warn('⚠️ [Fallback] Container #uploadPreview não encontrado');
            return;
        }
        
        const allFiles = [
            ...(this.state.existing || []).filter(item => !item.markedForDeletion),
            ...(this.state.files || [])
        ];
        
        console.log(`📸 [Fallback] Renderizando ${allFiles.length} arquivo(s) (${this.state.existing.length} existentes, ${this.state.files.length} novos)`);
        
        if (allFiles.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 2rem;">
                    <i class="fas fa-images" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p style="margin: 0;">Nenhuma foto ou vídeo adicionada</p>
                    <small style="font-size: 0.8rem;">Arraste ou clique para adicionar</small>
                </div>
            `;
            return;
        }
        
        let html = '<div class="media-sortable-container" style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
        allFiles.forEach((item, index) => {
            const isMarked = item.markedForDeletion;
            const isExisting = item.isExisting;
            const isNew = item.isNew;
            const isVideo = item.isVideo === true || 
                            (item.type && item.type.startsWith('video/')) ||
                            (item.name && item.name.toLowerCase().match(/\.(mp4|mov|webm|avi)$/));
            
            let borderColor = isVideo ? '#9b59b6' : '#3498db';
            let statusText = isNew ? 'Novo' : (isExisting ? 'Existente' : '');
            
            if (isMarked) {
                borderColor = '#e74c3c';
                statusText = 'Excluir';
            }
            
            let imageUrl = item.uploadedUrl || item.url || item.preview;
            const displayName = item.name || 'Arquivo';
            const shortName = displayName.length > 15 ? displayName.substring(0, 12) + '...' : displayName;
            
            // ✅ ADICIONAR ATRIBUTOS PARA DRAG & DROP
            html += `
                <div class="media-preview-item-fallback draggable-item" 
                     draggable="true"
                     data-id="${item.id}"
                     data-type="media"
                     title="${this.escapeHtml(displayName)}"
                     style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:#f0f0f0;cursor:grab;">
                    
                    <div style="width:100%;height:70px;overflow:hidden;background:#2c3e50;display:flex;align-items:center;justify-content:center;">
                        ${imageUrl ? `<img src="${imageUrl}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">` : ''}
                        <div style="display:${imageUrl ? 'none' : 'flex'};flex-direction:column;align-items:center;color:white;">
                            <i class="fas fa-image" style="font-size:1.5rem;"></i>
                            <span style="font-size:0.6rem;">${this.escapeHtml(shortName)}</span>
                        </div>
                    </div>
                    
                    <div style="padding:5px;font-size:0.65rem;text-align:center;background:white;">
                        ${statusText}
                    </div>
                    
                    <div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.6);color:white;width:20px;height:20px;border-radius:0 0 6px 0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;">
                        <i class="fas fa-arrows-alt"></i>
                    </div>
                    
                    <button onclick="window.MediaSystem?.removeFile && window.MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:-5px;right:-5px;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:12px;font-weight:bold;z-index:10;">
                        ${isMarked ? '↺' : '×'}
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // ✅ CONFIGURAR DRAG & DROP DO FALLBACK
        this.setupFallbackDragAndDrop('uploadPreview');
        console.log('✅ [Fallback] renderMediaPreviewFallback concluído com drag & drop');
    },

    // ========== FALLBACK PARA PREVIEW DE PDFs (COM DRAG & DROP) ==========
    renderPdfPreviewFallback: function() {
        const container = document.getElementById('pdfUploadPreview');
        if (!container) {
            console.warn('⚠️ [Fallback] Container #pdfUploadPreview não encontrado');
            return;
        }
        
        const allPdfs = [
            ...(this.state.existingPdfs || []).filter(item => !item.markedForDeletion),
            ...(this.state.pdfs || [])
        ];
        
        console.log(`📄 [Fallback] Renderizando ${allPdfs.length} PDF(s) (${this.state.existingPdfs.length} existentes, ${this.state.pdfs.length} novos)`);
        
        if (allPdfs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                </div>
            `;
            return;
        }
        
        let html = '<div class="pdf-sortable-container" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
        
        allPdfs.forEach((pdf, index) => {
            const isMarked = pdf.markedForDeletion;
            const isExisting = pdf.isExisting;
            
            let borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            let statusText = isMarked ? 'Excluir' : (isExisting ? 'Existente' : 'Novo');
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            
            // ✅ ADICIONAR ATRIBUTOS PARA DRAG & DROP
            html += `
                <div class="pdf-preview-item-fallback draggable-item"
                     draggable="true"
                     data-id="${pdf.id}"
                     data-type="pdf"
                     style="position:relative;cursor:grab;">
                    <div style="background:#f8f9fa;border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:80px;text-align:center;">
                        <div style="position:absolute;top:-5px;left:-5px;background:rgba(0,0,0,0.5);color:white;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;">
                            <i class="fas fa-arrows-alt"></i>
                        </div>
                        <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};"></i>
                        <p style="font-size:0.65rem;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(shortName)}</p>
                        <small style="color:#666;font-size:0.6rem;">${statusText}</small>
                    </div>
                    <button onclick="window.MediaSystem?.removeFile && window.MediaSystem.removeFile('${pdf.id}')" 
                            style="position:absolute;top:-8px;right:-8px;background:${borderColor};color:white;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:10px;font-weight:bold;">
                        ×
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
        
        // ✅ CONFIGURAR DRAG & DROP DO FALLBACK
        this.setupFallbackDragAndDrop('pdfUploadPreview');
        console.log('✅ [Fallback] renderPdfPreviewFallback concluído com drag & drop');
    },

    // ========== SETUP DRAG & DROP PARA FALLBACK ==========
    setupFallbackDragAndDrop: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Remover listeners antigos para evitar duplicação
        if (container._dragListenersSetup) return;
        container._dragListenersSetup = true;
        
        console.log(`🎯 [Fallback] Configurando drag & drop para: ${containerId}`);
        
        container.addEventListener('dragstart', (e) => {
            const draggable = e.target.closest('.draggable-item');
            if (!draggable) return;
            
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: draggable.dataset.id,
                type: draggable.dataset.type || 'media'
            }));
            e.dataTransfer.effectAllowed = 'move';
            draggable.classList.add('dragging');
            draggable.style.opacity = '0.5';
        });
        
        container.addEventListener('dragend', (e) => {
            document.querySelectorAll('.dragging').forEach(el => {
                el.classList.remove('dragging');
                el.style.opacity = '';
            });
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const dropTarget = e.target.closest('.draggable-item');
            if (dropTarget && !dropTarget.classList.contains('drag-over')) {
                document.querySelectorAll('.drag-over').forEach(el => {
                    el.classList.remove('drag-over');
                    el.style.borderColor = '';
                });
                dropTarget.classList.add('drag-over');
                dropTarget.style.borderColor = '#f39c12';
                dropTarget.style.borderWidth = '2px';
                dropTarget.style.borderStyle = 'dashed';
            }
        });
        
        container.addEventListener('dragleave', (e) => {
            const dropTarget = e.target.closest('.draggable-item');
            if (dropTarget) {
                dropTarget.classList.remove('drag-over');
                dropTarget.style.borderColor = '';
            }
        });
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Limpar estilos
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
                el.style.borderColor = '';
            });
            
            let dragData;
            try {
                dragData = JSON.parse(e.dataTransfer.getData('text/plain'));
            } catch (err) {
                console.warn('Erro ao parsear drag data:', err);
                return;
            }
            
            const dropTarget = e.target.closest('.draggable-item');
            if (!dropTarget) return;
            
            const targetId = dropTarget.dataset.id;
            const targetType = dropTarget.dataset.type || 'media';
            
            if (dragData.id === targetId) return;
            if (dragData.type !== targetType) return; // Não misturar media com pdf
            
            console.log(`🔄 [Fallback] Reordenando: ${dragData.id} → ${targetId} (tipo: ${dragData.type})`);
            
            // Reordenar baseado no tipo
            if (dragData.type === 'media') {
                this.reorderMediaItems(dragData.id, targetId);
            } else if (dragData.type === 'pdf') {
                this.reorderPdfItems(dragData.id, targetId);
            }
            
            // Re-renderizar
            setTimeout(() => {
                this.renderMediaPreviewFallback();
                this.renderPdfPreviewFallback();
            }, 50);
        });
    },

    // ========== REORDENAR ITENS DE MÍDIA ==========
    reorderMediaItems: function(draggedId, targetId) {
        // Combinar arrays existentes e novos
        const allMedia = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
        const draggedIndex = allMedia.findIndex(item => item.id === draggedId);
        const targetIndex = allMedia.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        // Mover o item
        const [draggedItem] = allMedia.splice(draggedIndex, 1);
        allMedia.splice(targetIndex, 0, draggedItem);
        
        // Reconstruir arrays separados
        const newExisting = [];
        const newFiles = [];
        
        allMedia.forEach(item => {
            if (item.isExisting) {
                newExisting.push(item);
            } else {
                newFiles.push(item);
            }
        });
        
        this.state.existing = newExisting;
        this.state.files = newFiles;
        
        console.log(`✅ [Fallback] Mídia reordenada: ${draggedId} → ${targetId}`);
    },

    // ========== REORDENAR ITENS DE PDF ==========
    reorderPdfItems: function(draggedId, targetId) {
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        const draggedIndex = allPdfs.findIndex(item => item.id === draggedId);
        const targetIndex = allPdfs.findIndex(item => item.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const [draggedItem] = allPdfs.splice(draggedIndex, 1);
        allPdfs.splice(targetIndex, 0, draggedItem);
        
        const newExistingPdfs = [];
        const newPdfs = [];
        
        allPdfs.forEach(item => {
            if (item.isExisting) {
                newExistingPdfs.push(item);
            } else {
                newPdfs.push(item);
            }
        });
        
        this.state.existingPdfs = newExistingPdfs;
        this.state.pdfs = newPdfs;
        
        console.log(`✅ [Fallback] PDF reordenado: ${draggedId} → ${targetId}`);
    },

    // ========== FUNÇÃO AUXILIAR ESCAPE HTML ==========
    escapeHtml: function(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },

    // ========== RESETAR ESTADO ==========
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
    console.log('✅ MediaSystem Core carregado - Lógica essencial + Fallback completo com drag & drop');
    console.log('📦 Modo: ' + (window.location.search.includes('debug=true') ? 
                'DEBUG (UI via Support System)' : 
                'PRODUÇÃO (UI via Fallback completo com drag & drop)'));
}, 1000);

console.log('✅ media-unified.js CORE carregado - ' + 
            (window.location.search.includes('debug=true') ? 
             'Modo DEBUG (UI via Support System)' : 
             'Modo PRODUÇÃO (UI via Fallback completo com drag & drop)'));
