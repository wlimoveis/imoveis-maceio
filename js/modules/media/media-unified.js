// js/modules/media/media-unified.js - CORE SYSTEM COM FALLBACK COMPLETO
// ✅ Contém lógica ESSENCIAL de upload/delete/estado
// ✅ UI completa delegada para Support System (em debug)
// ✅ Fallback COMPLETO para produção (previews + drag & drop)

console.log('🔄 media-unified.js - Core System (lógica essencial + fallback completo)');

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
        files: [],
        existing: [],
        pdfs: [],
        existingPdfs: [],
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
        return this;
    },

    // ========== EVENT LISTENERS ==========
    setupEventListeners: function() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput && !uploadArea.hasAttribute('data-listener')) {
            uploadArea.setAttribute('data-listener', 'true');
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
        
        if (pdfUploadArea && pdfFileInput && !pdfUploadArea.hasAttribute('data-listener')) {
            pdfUploadArea.setAttribute('data-listener', 'true');
            pdfUploadArea.addEventListener('click', () => pdfFileInput.click());
            
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
        
        this.state.existing = [];
        this.state.existingPdfs = [];
        
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

    // ========== FUNÇÃO AUXILIAR ==========
    isVideoUrl: function(url) {
        if (!url) return false;
        const urlLower = url.toLowerCase();
        return urlLower.includes('.mp4') || urlLower.includes('.mov') || 
               urlLower.includes('.webm') || urlLower.includes('.avi') ||
               urlLower.includes('video/');
    },

    escapeHtml: function(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
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
            const newFiles = this.state.files.filter(item => {
                return item.isNew === true && item.file instanceof File && !item.uploaded;
            });
            
            await this.processDeletions();
            
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
        }
    },

    // ========== EXCLUSÃO FÍSICA ==========
    async deleteFileFromStorage(fileUrl) {
        if (!fileUrl) return { success: false, error: 'No URL provided' };
        
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

            if (!filePath) return { success: false, error: 'Empty file path' };

            try { filePath = decodeURIComponent(filePath); } catch (e) {}

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
                return { success: false, error: `HTTP ${response.status}` };
            }
            
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async deleteFilesFromStorage(urls) {
        if (!urls || urls.length === 0) {
            return { success: true, deletedCount: 0, failedCount: 0 };
        }

        let deletedCount = 0;
        let failedCount = 0;

        for (let i = 0; i < urls.length; i++) {
            const result = await this.deleteFileFromStorage(urls[i]);
            if (result.success) { deletedCount++; } else { failedCount++; }
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return { success: failedCount === 0, deletedCount, failedCount };
    },

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

    // ========== FUNÇÃO PARA SALVAR LOCALMENTE ==========
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
        
        return { images: imageUrls.join(','), pdfs: pdfUrls.join(',') };
    },

    // ========== UI DELEGATION ==========
    updateUI: function() {
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        
        this._updateTimeout = setTimeout(() => {
            if (window.SupportUI && typeof window.SupportUI.renderMediaPreview === 'function') {
                window.SupportUI.renderMediaPreview(this);
                window.SupportUI.renderPdfPreview(this);
            } else {
                this.renderMediaPreviewFallback();
                this.renderPdfPreviewFallback();
            }
        }, 50);
    },

    // ========== FALLBACK COMPLETO PARA PREVIEW DE MÍDIA ==========
    renderMediaPreviewFallback: function() {
        const container = document.getElementById('uploadPreview');
        if (!container) return;
        
        const allFiles = [
            ...this.state.existing.filter(item => !item.markedForDeletion),
            ...this.state.files
        ];
        
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
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
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
            
            html += `
                <div class="media-preview-item-fallback" style="position:relative;width:100px;height:100px;border-radius:8px;overflow:hidden;border:2px solid ${borderColor};background:#f0f0f0;">
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
                    <button onclick="MediaSystem.removeFile('${item.id}')" 
                            style="position:absolute;top:-5px;right:-5px;background:${isMarked ? '#c0392b' : '#e74c3c'};color:white;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:12px;font-weight:bold;">
                        ${isMarked ? '↺' : '×'}
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ========== FALLBACK COMPLETO PARA PREVIEW DE PDFs ==========
    renderPdfPreviewFallback: function() {
        const container = document.getElementById('pdfUploadPreview');
        if (!container) return;
        
        const allPdfs = [
            ...this.state.existingPdfs.filter(item => !item.markedForDeletion),
            ...this.state.pdfs
        ];
        
        if (allPdfs.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #95a5a6; padding: 1rem; font-size: 0.9rem;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 1.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p style="margin: 0;">Arraste ou clique para adicionar PDFs</p>
                </div>
            `;
            return;
        }
        
        let html = '<div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">';
        
        allPdfs.forEach((pdf, index) => {
            const isMarked = pdf.markedForDeletion;
            const isExisting = pdf.isExisting;
            
            let borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            let statusText = isMarked ? 'Excluir' : (isExisting ? 'Existente' : 'Novo');
            const shortName = pdf.name.length > 15 ? pdf.name.substring(0, 12) + '...' : pdf.name;
            
            html += `
                <div style="position:relative;">
                    <div style="background:#f8f9fa;border:1px solid ${borderColor};border-radius:6px;padding:0.5rem;width:80px;text-align:center;">
                        <i class="fas fa-file-pdf" style="font-size:1.2rem;color:${borderColor};"></i>
                        <p style="font-size:0.65rem;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this.escapeHtml(shortName)}</p>
                        <small style="color:#666;font-size:0.6rem;">${statusText}</small>
                    </div>
                    <button onclick="MediaSystem.removeFile('${pdf.id}')" 
                            style="position:absolute;top:-8px;right:-8px;background:${borderColor};color:white;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:10px;font-weight:bold;">
                        ×
                    </button>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ========== UTILIDADES ==========
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
        
        return { images: imageUrls.join(','), pdfs: pdfUrls.join(',') };
    },

    extractFileName: function(url) {
        if (!url) return 'arquivo';
        try {
            const urlWithoutQuery = url.split('?')[0];
            const parts = urlWithoutQuery.split('/');
            let fileName = parts[parts.length - 1] || 'arquivo';
            try { fileName = decodeURIComponent(fileName); } catch (e) {}
            if (fileName.length > 50) fileName = fileName.substring(0, 47) + '...';
            return fileName;
        } catch { return 'arquivo'; }
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        if (filename.startsWith('http')) return filename;
        if (!filename.includes('.')) return null;
        try {
            const SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            const bucket = this.config.buckets[this.config.currentSystem];
            return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
        } catch { return null; }
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'image/jpeg';
        const urlLower = url.toLowerCase();
        if (urlLower.includes('.mp4') || urlLower.includes('.mov')) return 'video/mp4';
        if (urlLower.includes('.jpg') || urlLower.includes('.jpeg')) return 'image/jpeg';
        if (urlLower.includes('.pdf')) return 'application/pdf';
        return 'image/jpeg';
    },

    resetState: function() {
        const cleanupBlobUrls = (items) => {
            items.forEach(item => {
                if (item.preview && item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview);
                if (item.blobUrl) URL.revokeObjectURL(item.blobUrl);
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

window.MediaSystem = MediaSystem;

setTimeout(() => {
    window.MediaSystem.init('vendas');
    const isDebug = window.location.search.includes('debug=true');
    console.log(`✅ MediaSystem Core carregado - Lógica essencial + Fallback completo`);
    console.log(`📦 Modo: ${isDebug ? 'DEBUG (UI via Support System)' : 'PRODUÇÃO (fallback completo com previews)'}`);
}, 1000);

console.log('✅ media-unified.js CORE - ' + 
            (window.location.search.includes('debug=true') ? 
             'Modo DEBUG (UI via Support System)' : 
             'Modo PRODUÇÃO (fallback completo com previews)'));
