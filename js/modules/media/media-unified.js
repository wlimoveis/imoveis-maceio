// js/modules/media/media-unified.js - CORE SYSTEM COMPLETO
// ✅ Contém lógica ESSENCIAL de upload/delete/estado
// ✅ FALLBACK COMPLETO com DRAG & DROP para produção
// ✅ UI completa delegada para Support System (em debug)
// ✅ Funções escapeHtml e isVideoUrl centralizadas no SharedCore
// ✅ Debounce aplicado em addFiles e addPdfs para otimização de performance
// ✅ LAYOUT HORIZONTAL com scroll para previews

console.log('🔄 media-unified.js - Core System (fallback completo com drag & drop)');

// ========== SUPABASE CONSTANTS ==========
if (typeof window.SUPABASE_CONSTANTS === 'undefined') {
    window.SUPABASE_CONSTANTS = {
        URL: 'https://wxdiowpswepsvklumgvx.supabase.co',
        KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4ZGlvd3Bzd2Vwc3ZrbHVtZ3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTExNzksImV4cCI6MjA4Nzk4NzE3OX0.QsUHE_w5m5-pz3LcwdREuwmwvCiX3Hz8FYv8SAwhD6U',
        ADMIN_PASSWORD: "wl654",
        PDF_PASSWORD: "doc123"
    };
}

// Função debounce centralizada (fallback caso SharedCore não esteja disponível)
const getDebounceFunction = function() {
    if (window.SharedCore && typeof window.SharedCore.debounce === 'function') {
        return window.SharedCore.debounce;
    }
    // Fallback inline
    return function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    };
};

const MediaSystem = {
    // ========== CONFIGURAÇÃO ==========
    config: {
        currentSystem: 'vendas',
        buckets: { vendas: 'properties', aluguel: 'rentals' },
        limits: { maxFiles: 10, maxSize: 5 * 1024 * 1024, maxPdfs: 5, maxPdfSize: 10 * 1024 * 1024 },
        allowedTypes: {
            images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            videos: ['video/mp4', 'video/quicktime'],
            pdfs: ['application/pdf']
        }
    },

    // ========== ESTADO ==========
    state: {
        files: [], existing: [], pdfs: [], existingPdfs: [],
        isUploading: false, currentPropertyId: null, lastUploadResult: null,
        _debouncedUpdateUI: null  // Cache da função debounced
    },

    // ========== INICIALIZAÇÃO ==========
    init(systemName) {
        var system = systemName || 'vendas';
        console.log('🔧 Inicializando sistema de mídia para: ' + system);
        this.config.currentSystem = system;
        this.resetState();
        this.setupEventListeners();
        
        // Inicializar função debounced para updateUI
        const debounce = getDebounceFunction();
        this.state._debouncedUpdateUI = debounce(() => this.updateUI(), 100);
        
        return this;
    },

    // ========== EVENT LISTENERS ==========
    setupEventListeners: function() {
        var uploadArea = document.getElementById('uploadArea');
        var fileInput = document.getElementById('fileInput');
        var self = this;
        
        if (uploadArea && fileInput && !uploadArea.hasAttribute('data-listener')) {
            uploadArea.setAttribute('data-listener', 'true');
            uploadArea.addEventListener('click', function() { fileInput.click(); });
            uploadArea.addEventListener('dragover', function(e) { 
                e.preventDefault(); 
                uploadArea.style.borderColor = '#3498db'; 
                uploadArea.style.background = '#e8f4fc'; 
            });
            uploadArea.addEventListener('dragleave', function() { 
                uploadArea.style.borderColor = '#ddd'; 
                uploadArea.style.background = '#fafafa'; 
            });
            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadArea.style.borderColor = '#ddd';
                uploadArea.style.background = '#fafafa';
                if (e.dataTransfer.files.length > 0) self.addFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', function(e) { 
                if (e.target.files.length > 0) { 
                    self.addFiles(e.target.files); 
                    e.target.value = ''; 
                } 
            });
        }
        
        var pdfUploadArea = document.getElementById('pdfUploadArea');
        var pdfFileInput = document.getElementById('pdfFileInput');
        
        if (pdfUploadArea && pdfFileInput && !pdfUploadArea.hasAttribute('data-listener')) {
            pdfUploadArea.setAttribute('data-listener', 'true');
            pdfUploadArea.addEventListener('click', function() { pdfFileInput.click(); });
            pdfUploadArea.addEventListener('dragover', function(e) { 
                e.preventDefault(); 
                pdfUploadArea.style.borderColor = '#27ae60'; 
                pdfUploadArea.style.background = '#e8f8ef'; 
            });
            pdfUploadArea.addEventListener('dragleave', function() { 
                pdfUploadArea.style.borderColor = '#ddd'; 
                pdfUploadArea.style.background = '#fafafa'; 
            });
            pdfUploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                pdfUploadArea.style.borderColor = '#ddd';
                pdfUploadArea.style.background = '#fafafa';
                if (e.dataTransfer.files.length > 0) {
                    var pdfFiles = [];
                    var files = Array.from(e.dataTransfer.files);
                    for (var i = 0; i < files.length; i++) {
                        if (files[i].type === 'application/pdf') pdfFiles.push(files[i]);
                    }
                    if (pdfFiles.length > 0) self.addPdfs(pdfFiles);
                }
            });
            pdfFileInput.addEventListener('change', function(e) { 
                if (e.target.files.length > 0) { 
                    self.addPdfs(e.target.files); 
                    e.target.value = ''; 
                } 
            });
        }
    },

    // ========== CARREGAR ARQUIVOS EXISTENTES ==========
    loadExisting: function(property) {
        if (!property) return this;
        console.log('📥 Carregando mídia existente para imóvel ' + property.id);
        this.state.currentPropertyId = property.id;
        this.state.existing = [];
        this.state.existingPdfs = [];
        var self = this;
        
        if (property.images && property.images !== 'EMPTY') {
            var imageUrls = property.images.split(',').map(function(url) { return url.trim(); }).filter(function(url) { return url && url !== 'EMPTY'; });
            this.state.existing = imageUrls.map(function(url, index) {
                var finalUrl = url;
                if (!url.startsWith('http') && !url.startsWith('blob:')) finalUrl = self.reconstructSupabaseUrl(url) || url;
                var isVideo = window.SharedCore ? window.SharedCore.isVideoUrl(finalUrl) : (function(u){ var l=u.toLowerCase(); return l.includes('.mp4')||l.includes('.mov')||l.includes('.webm')||l.includes('.avi')||l.includes('video/'); })(finalUrl);
                return { 
                    url: finalUrl, 
                    preview: finalUrl, 
                    id: 'existing_img_' + property.id + '_' + index, 
                    name: self.extractFileName(url), 
                    type: self.getFileTypeFromUrl(url), 
                    isExisting: true, 
                    markedForDeletion: false, 
                    isNew: false, 
                    isVideo: isVideo 
                };
            });
        }
        
        if (property.pdfs && property.pdfs !== 'EMPTY') {
            var pdfUrls = property.pdfs.split(',').map(function(url) { return url.trim(); }).filter(function(url) { return url && url !== 'EMPTY'; });
            this.state.existingPdfs = pdfUrls.map(function(url, index) { return { 
                url: url, 
                id: 'existing_pdf_' + property.id + '_' + index, 
                name: self.extractFileName(url), 
                isExisting: true, 
                markedForDeletion: false, 
                type: 'application/pdf' 
            }; });
        }
        
        this.updateUI();
        return this;
    },

    // ========== FUNÇÕES AUXILIARES (USAM SHAREDCORE) ==========

    // ========== ADICIONAR ARQUIVOS ==========
    addFiles: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        var addedCount = 0;
        var self = this;
        var filesArray = Array.from(fileList);
        for (var f = 0; f < filesArray.length; f++) {
            var file = filesArray[f];
            var isImage = self.config.allowedTypes.images.indexOf(file.type) !== -1;
            var isVideo = self.config.allowedTypes.videos.indexOf(file.type) !== -1;
            if (!isImage && !isVideo) { alert('❌ "' + file.name + '" - Tipo não suportado!'); continue; }
            if (file.size > self.config.limits.maxSize) { alert('❌ "' + file.name + '" - Máximo: 5MB'); continue; }
            var blobUrl = URL.createObjectURL(file);
            self.state.files.push({ 
                file: file, 
                id: 'new_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), 
                name: file.name, 
                type: file.type, 
                preview: blobUrl, 
                isImage: isImage, 
                isVideo: isVideo, 
                isNew: true, 
                uploaded: false, 
                uploadedUrl: null, 
                blobUrl: blobUrl 
            });
            addedCount++;
        }
        // ✅ APLICADO DEBOUNCE para evitar múltiplas atualizações de UI rápidas
        if (this.state._debouncedUpdateUI) {
            this.state._debouncedUpdateUI();
        } else {
            this.updateUI();
        }
        return addedCount;
    },

    addPdfs: function(fileList) {
        if (!fileList || fileList.length === 0) return 0;
        var addedCount = 0;
        var self = this;
        var filesArray = Array.from(fileList);
        for (var f = 0; f < filesArray.length; f++) {
            var file = filesArray[f];
            if (self.config.allowedTypes.pdfs.indexOf(file.type) === -1) { alert('❌ "' + file.name + '" - Não é PDF!'); continue; }
            if (file.size > self.config.limits.maxPdfSize) { alert('❌ "' + file.name + '" - Máximo: 10MB'); continue; }
            self.state.pdfs.push({ 
                file: file, 
                id: 'pdf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9), 
                name: file.name, 
                isNew: true, 
                uploaded: false, 
                uploadedUrl: null 
            });
            addedCount++;
        }
        // ✅ APLICADO DEBOUNCE para evitar múltiplas atualizações de UI rápidas
        if (this.state._debouncedUpdateUI) {
            this.state._debouncedUpdateUI();
        } else {
            this.updateUI();
        }
        return addedCount;
    },

    // ========== UPLOAD ==========
    uploadSingleFile: function(file, propertyId, type) {
        var self = this;
        var t = type || 'media';
        return new Promise(function(resolve, reject) {
            var SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            var SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
            var bucket = self.config.buckets[self.config.currentSystem];
            var timestamp = Date.now();
            var random = Math.random().toString(36).substring(2, 10);
            var safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50);
            var prefix = t === 'pdf' ? 'pdf' : 'media';
            var fileName = prefix + '_' + propertyId + '_' + timestamp + '_' + random + '_' + safeName;
            var filePath = bucket + '/' + fileName;
            var uploadUrl = SUPABASE_URL + '/storage/v1/object/' + filePath;
            
            fetch(uploadUrl, { 
                method: 'POST', 
                headers: { 
                    'Authorization': 'Bearer ' + SUPABASE_KEY, 
                    'apikey': SUPABASE_KEY, 
                    'Content-Type': file.type || 'application/octet-stream' 
                }, 
                body: file 
            }).then(function(response) {
                if (response.ok) { 
                    var publicUrl = SUPABASE_URL + '/storage/v1/object/public/' + filePath; 
                    resolve(publicUrl); 
                } else { 
                    reject(new Error('Upload falhou: ' + response.status)); 
                }
            }).catch(function(error) { 
                reject(error); 
            });
        });
    },

    uploadAll: function(propertyId, propertyTitle) {
        var self = this;
        if (this.state.isUploading) return Promise.resolve({ success: false, images: '', pdfs: '', uploadedCount: 0, error: 'Upload em andamento' });
        this.state.isUploading = true;
        
        return (async function() {
            try {
                var newFiles = self.state.files.filter(function(item) { return item.isNew === true && item.file instanceof File && !item.uploaded; });
                await self.processDeletions();
                var uploadedImageUrls = [];
                
                for (var i = 0; i < newFiles.length; i++) {
                    var fileItem = newFiles[i];
                    try {
                        var uploadedUrl = await self.uploadSingleFile(fileItem.file, propertyId, 'media');
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
                        console.error('❌ Erro ao enviar "' + fileItem.name + '":', error); 
                    }
                }
                
                var newPdfs = self.state.pdfs.filter(function(pdf) { return pdf.isNew && pdf.file && !pdf.uploaded; });
                var uploadedPdfUrls = [];
                
                for (var j = 0; j < newPdfs.length; j++) {
                    var pdfItem = newPdfs[j];
                    try {
                        var uploadedUrl2 = await self.uploadSingleFile(pdfItem.file, propertyId, 'pdf');
                        if (uploadedUrl2) { 
                            pdfItem.uploadedUrl = uploadedUrl2; 
                            pdfItem.uploaded = true; 
                            pdfItem.isNew = false; 
                            uploadedPdfUrls.push(uploadedUrl2); 
                        }
                    } catch (error) { 
                        console.error('❌ Erro ao enviar PDF "' + pdfItem.name + '":', error); 
                    }
                }
                
                var existingImageUrls = self.state.existing.filter(function(item) { return !item.markedForDeletion && item.url; }).map(function(item) { return item.url; });
                var existingPdfUrls = self.state.existingPdfs.filter(function(item) { return !item.markedForDeletion && item.url; }).map(function(item) { return item.url; });
                var allImageUrls = uploadedImageUrls.concat(existingImageUrls);
                var allPdfUrls = uploadedPdfUrls.concat(existingPdfUrls);
                var result = { 
                    success: true, 
                    images: allImageUrls.join(','), 
                    pdfs: allPdfUrls.join(','), 
                    uploadedCount: uploadedImageUrls.length + uploadedPdfUrls.length 
                };
                self.state.lastUploadResult = result;
                self.updateUI();
                return result;
            } catch (error) { 
                console.error('❌ ERRO NO UPLOAD:', error); 
                return { success: false, images: '', pdfs: '', uploadedCount: 0, error: error.message }; 
            } finally { 
                self.state.isUploading = false; 
            }
        })();
    },

    // ========== EXCLUSÃO ==========
    deleteFileFromStorage: function(fileUrl) {
        var self = this;
        if (!fileUrl) return Promise.resolve({ success: false, error: 'No URL provided' });
        
        return (async function() {
            try {
                var SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
                var SUPABASE_KEY = window.SUPABASE_CONSTANTS.KEY;
                var bucket = self.config.buckets[self.config.currentSystem];
                var publicPathPattern = '/storage/v1/object/public/' + bucket + '/';
                var pathIndex = fileUrl.indexOf(publicPathPattern);
                var filePath = null;
                
                if (pathIndex !== -1) { 
                    filePath = fileUrl.substring(pathIndex + publicPathPattern.length).split('?')[0]; 
                } else { 
                    var fileName = fileUrl.split('/').pop().split('?')[0]; 
                    if (fileName && fileName.indexOf('_') !== -1) filePath = fileName; 
                    else return { success: false, error: 'Could not extract file path' }; 
                }
                
                if (!filePath) return { success: false, error: 'Empty file path' };
                try { filePath = decodeURIComponent(filePath); } catch(e) {}
                
                var deleteUrl = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + filePath;
                var response = await fetch(deleteUrl, { 
                    method: 'DELETE', 
                    headers: { 
                        'Authorization': 'Bearer ' + SUPABASE_KEY, 
                        'apikey': SUPABASE_KEY 
                    } 
                });
                
                if (response.ok) return { success: true, deletedUrl: fileUrl, filePath: filePath };
                else return { success: false, error: 'HTTP ' + response.status };
            } catch (error) { 
                return { success: false, error: error.message }; 
            }
        })();
    },

    deleteFilesFromStorage: function(urls) {
        var self = this;
        if (!urls || urls.length === 0) return Promise.resolve({ success: true, deletedCount: 0, failedCount: 0 });
        
        return (async function() {
            var deletedCount = 0, failedCount = 0;
            for (var i = 0; i < urls.length; i++) {
                var result = await self.deleteFileFromStorage(urls[i]);
                if (result.success) deletedCount++; else failedCount++;
                await new Promise(function(resolve) { setTimeout(resolve, 100); });
            }
            return { success: failedCount === 0, deletedCount: deletedCount, failedCount: failedCount };
        })();
    },

    processDeletions: function() {
        var self = this;
        return (async function() {
            var imagesToDelete = self.state.existing.filter(function(item) { return item.markedForDeletion; });
            var pdfsToDelete = self.state.existingPdfs.filter(function(item) { return item.markedForDeletion; });
            if (imagesToDelete.length > 0 || pdfsToDelete.length > 0) {
                self.state.existing = self.state.existing.filter(function(item) { return !item.markedForDeletion; });
                self.state.existingPdfs = self.state.existingPdfs.filter(function(item) { return !item.markedForDeletion; });
            }
            return { imagesToDelete: imagesToDelete.length, pdfsToDelete: pdfsToDelete.length };
        })();
    },

    removeFile: function(fileId) {
        var self = this;
        var searchInArray = function(array) {
            for (var i = 0; i < array.length; i++) {
                if (array[i].id === fileId) {
                    var removed = array[i];
                    if (removed.isExisting) { 
                        removed.markedForDeletion = true; 
                    } else { 
                        if (removed.preview && removed.preview.startsWith('blob:')) URL.revokeObjectURL(removed.preview); 
                        array.splice(i, 1); 
                    }
                    return true;
                }
            }
            return false;
        };
        if (searchInArray(this.state.files)) return true;
        if (searchInArray(this.state.existing)) return true;
        if (searchInArray(this.state.pdfs)) return true;
        if (searchInArray(this.state.existingPdfs)) return true;
        return false;
    },

    saveAndKeepLocal: function(propertyId, propertyTitle) {
        var allMedia = this.state.existing.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.files);
        var allPdfs = this.state.existingPdfs.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.pdfs);
        var imageUrls = allMedia.map(function(item) { return item.uploadedUrl || item.url || item.preview; }).filter(function(url) { return url !== null; });
        var pdfUrls = allPdfs.map(function(item) { return item.uploadedUrl || item.url; }).filter(function(url) { return url !== null; });
        
        this.state.files.forEach(function(item) { if (item.isNew && !item.uploaded) { item.uploaded = true; item.isNew = false; item.uploadedUrl = item.preview; } });
        this.state.pdfs.forEach(function(pdf) { if (pdf.isNew && !pdf.uploaded) { pdf.uploaded = true; pdf.isNew = false; } });
        this.updateUI();
        return { images: imageUrls.join(','), pdfs: pdfUrls.join(',') };
    },

    getOrderedMediaUrls: function() {
        var allMedia = this.state.existing.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.files);
        var allPdfs = this.state.existingPdfs.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.pdfs);
        var imageUrls = allMedia.map(function(item) { return item.uploadedUrl || item.url; }).filter(function(url) { return url !== null && url !== undefined; });
        var pdfUrls = allPdfs.map(function(item) { return item.uploadedUrl || item.url; }).filter(function(url) { return url !== null && url !== undefined; });
        return { images: imageUrls.join(','), pdfs: pdfUrls.join(',') };
    },

    // ========== UI DELEGATION ==========
    updateUI: function() {
        var self = this;
        if (this._updateTimeout) clearTimeout(this._updateTimeout);
        this._updateTimeout = setTimeout(function() {
            if (window.SupportUI && typeof window.SupportUI.renderMediaPreview === 'function') {
                window.SupportUI.renderMediaPreview(self);
                window.SupportUI.renderPdfPreview(self);
            } else {
                self.renderMediaPreviewComplete();
                self.renderPdfPreviewComplete();
                self.setupCompleteDragAndDrop();
            }
        }, 50);
    },

    // ========== RENDER COMPLETO COM DRAG & DROP (PRODUÇÃO) - LAYOUT HORIZONTAL ==========
    renderMediaPreviewComplete: function() {
        var container = document.getElementById('uploadPreview');
        if (!container) return;
        var self = this;
        var escapeHtmlFn = window.SharedCore ? window.SharedCore.escapeHtml : (function(s){ if(!s)return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); });
        
        var allFiles = this.state.existing.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.files);
        
        if (allFiles.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#95a5a6;padding:2rem;"><i class="fas fa-images" style="font-size:2rem;margin-bottom:1rem;opacity:0.5;"></i><p style="margin:0;">Nenhuma foto ou vídeo adicionada</p><small style="font-size:0.8rem;">Arraste ou clique para adicionar</small></div>';
            return;
        }
        
        // LAYOUT HORIZONTAL: flex-wrap nowrap com overflow-x auto
        var html = '<div class="media-sortable-container" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:10px;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;">';
        
        for (var idx = 0; idx < allFiles.length; idx++) {
            var item = allFiles[idx];
            var index = idx;
            var isMarked = item.markedForDeletion;
            var isExisting = item.isExisting;
            var isNew = item.isNew;
            var isVideo = item.isVideo === true || (item.type && item.type.startsWith('video/')) || (item.name && item.name.toLowerCase().match(/\.(mp4|mov|webm|avi)$/));
            var borderColor = isVideo ? '#9b59b6' : '#3498db';
            var statusText = isNew ? 'Novo' : (isExisting ? 'Existente' : '');
            if (isMarked) { borderColor = '#e74c3c'; statusText = 'Excluir'; }
            var imageUrl = item.uploadedUrl || item.url || item.preview;
            var displayName = item.name || 'Arquivo';
            var shortName = displayName.length > 15 ? displayName.substring(0,12)+'...' : displayName;
            
            html += '<div class="media-preview-item-complete draggable-item" draggable="true" data-id="' + item.id + '" data-type="media" title="' + escapeHtmlFn(displayName) + '" style="position:relative;width:100px;height:100px;flex:0 0 auto;border-radius:8px;overflow:hidden;border:2px solid ' + borderColor + ';background:#f0f0f0;cursor:grab;">';
            html += '<div style="width:100%;height:70px;overflow:hidden;background:#2c3e50;display:flex;align-items:center;justify-content:center;">';
            if (imageUrl) {
                html += '<img src="' + imageUrl + '" style="width:100%;height:100%;object-fit:contain;" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';">';
            }
            html += '<div style="display:' + (imageUrl ? 'none' : 'flex') + ';flex-direction:column;align-items:center;color:white;"><i class="fas fa-image" style="font-size:1.5rem;"></i><span style="font-size:0.6rem;">' + escapeHtmlFn(shortName) + '</span></div>';
            html += '</div>';
            html += '<div style="padding:5px;font-size:0.65rem;text-align:center;background:white;">' + statusText + '</div>';
            html += '<div style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.6);color:white;width:20px;height:20px;border-radius:0 0 6px 0;display:flex;align-items:center;justify-content:center;font-size:0.65rem;"><i class="fas fa-arrows-alt"></i></div>';
            html += '<div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.8);color:white;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:bold;">' + (index+1) + '</div>';
            html += '<button onclick="MediaSystem.removeFile(\'' + item.id + '\')" style="position:absolute;top:-5px;right:-5px;background:' + (isMarked ? '#c0392b' : '#e74c3c') + ';color:white;border:none;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:12px;font-weight:bold;z-index:10;">' + (isMarked ? '↺' : '×') + '</button>';
            html += '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    renderPdfPreviewComplete: function() {
        var container = document.getElementById('pdfUploadPreview');
        if (!container) return;
        var self = this;
        var escapeHtmlFn = window.SharedCore ? window.SharedCore.escapeHtml : (function(s){ if(!s)return ''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); });
        
        var allPdfs = this.state.existingPdfs.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.pdfs);
        
        if (allPdfs.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:#95a5a6;padding:1rem;font-size:0.9rem;"><i class="fas fa-cloud-upload-alt" style="font-size:1.5rem;margin-bottom:0.5rem;opacity:0.5;"></i><p style="margin:0;">Arraste ou clique para adicionar PDFs</p></div>';
            return;
        }
        
        // LAYOUT HORIZONTAL: flex-wrap nowrap com overflow-x auto
        var html = '<div class="pdf-sortable-container" style="display:flex;flex-direction:row;flex-wrap:nowrap;gap:10px;overflow-x:auto;overflow-y:hidden;padding-bottom:10px;">';
        
        for (var idx = 0; idx < allPdfs.length; idx++) {
            var pdf = allPdfs[idx];
            var index = idx;
            var isMarked = pdf.markedForDeletion;
            var isExisting = pdf.isExisting;
            var borderColor = isMarked ? '#e74c3c' : (isExisting ? '#27ae60' : '#3498db');
            var statusText = isMarked ? 'Excluir' : (isExisting ? 'Existente' : 'Novo');
            var shortName = pdf.name.length > 15 ? pdf.name.substring(0,12)+'...' : pdf.name;
            
            html += '<div class="pdf-preview-item-complete draggable-item" draggable="true" data-id="' + pdf.id + '" data-type="pdf" style="position:relative;flex:0 0 auto;cursor:grab;">';
            html += '<div style="background:#f8f9fa;border:1px solid ' + borderColor + ';border-radius:6px;padding:0.5rem;width:80px;text-align:center;">';
            html += '<div style="position:absolute;top:-5px;left:-5px;background:rgba(0,0,0,0.5);color:white;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.6rem;"><i class="fas fa-arrows-alt"></i></div>';
            html += '<i class="fas fa-file-pdf" style="font-size:2rem;color:' + borderColor + ';"></i>';
            html += '<p style="font-size:0.65rem;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtmlFn(shortName) + '</p>';
            html += '<small style="color:#666;font-size:0.6rem;">' + statusText + '</small>';
            html += '</div>';
            html += '<button onclick="MediaSystem.removeFile(\'' + pdf.id + '\')" style="position:absolute;top:-8px;right:-8px;background:' + borderColor + ';color:white;border:none;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:10px;font-weight:bold;">×</button>';
            html += '</div>';
        }
        
        html += '</div>';
        container.innerHTML = html;
    },

    // ========== DRAG & DROP COMPLETO (PRODUÇÃO) ==========
    setupCompleteDragAndDrop: function() {
        var containers = ['uploadPreview', 'pdfUploadPreview'];
        var self = this;
        
        for (var c = 0; c < containers.length; c++) {
            var containerId = containers[c];
            var container = document.getElementById(containerId);
            if (!container || container.hasAttribute('data-drag-drop')) continue;
            container.setAttribute('data-drag-drop', 'true');
            
            container.addEventListener('dragstart', function(e) {
                var draggable = e.target.closest('.draggable-item');
                if (!draggable) return;
                e.dataTransfer.setData('text/plain', JSON.stringify({ id: draggable.dataset.id, type: draggable.dataset.type || 'media' }));
                e.dataTransfer.effectAllowed = 'move';
                draggable.classList.add('dragging');
                draggable.style.opacity = '0.5';
            });
            
            container.addEventListener('dragend', function() {
                var dragging = document.querySelectorAll('.dragging');
                for (var i = 0; i < dragging.length; i++) {
                    dragging[i].classList.remove('dragging');
                    dragging[i].style.opacity = '';
                }
            });
            
            container.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                var dropTarget = e.target.closest('.draggable-item');
                if (dropTarget && !dropTarget.classList.contains('drag-over')) {
                    var dragOver = document.querySelectorAll('.drag-over');
                    for (var i = 0; i < dragOver.length; i++) {
                        dragOver[i].classList.remove('drag-over');
                        dragOver[i].style.borderColor = '';
                    }
                    dropTarget.classList.add('drag-over');
                    dropTarget.style.borderColor = '#f39c12';
                    dropTarget.style.borderWidth = '2px';
                    dropTarget.style.borderStyle = 'dashed';
                }
            });
            
            container.addEventListener('dragleave', function(e) {
                var dropTarget = e.target.closest('.draggable-item');
                if (dropTarget) { dropTarget.classList.remove('drag-over'); dropTarget.style.borderColor = ''; }
            });
            
            container.addEventListener('drop', function(e) {
                e.preventDefault();
                var dragOver = document.querySelectorAll('.drag-over');
                for (var i = 0; i < dragOver.length; i++) {
                    dragOver[i].classList.remove('drag-over');
                    dragOver[i].style.borderColor = '';
                }
                var dragData;
                try { dragData = JSON.parse(e.dataTransfer.getData('text/plain')); } catch(err) { return; }
                var dropTarget = e.target.closest('.draggable-item');
                if (!dropTarget) return;
                var targetId = dropTarget.dataset.id;
                var targetType = dropTarget.dataset.type || 'media';
                if (dragData.id === targetId || dragData.type !== targetType) return;
                if (dragData.type === 'media') { self.reorderMediaItemsComplete(dragData.id, targetId); }
                else if (dragData.type === 'pdf') { self.reorderPdfItemsComplete(dragData.id, targetId); }
                setTimeout(function() { self.renderMediaPreviewComplete(); self.renderPdfPreviewComplete(); self.setupCompleteDragAndDrop(); }, 50);
            });
        }
    },

    reorderMediaItemsComplete: function(draggedId, targetId) {
        var allMedia = this.state.existing.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.files);
        var draggedIndex = -1, targetIndex = -1;
        for (var i = 0; i < allMedia.length; i++) {
            if (allMedia[i].id === draggedId) draggedIndex = i;
            if (allMedia[i].id === targetId) targetIndex = i;
        }
        if (draggedIndex === -1 || targetIndex === -1) return;
        var draggedItem = allMedia[draggedIndex];
        allMedia.splice(draggedIndex, 1);
        allMedia.splice(targetIndex, 0, draggedItem);
        var newExisting = [], newFiles = [];
        for (var j = 0; j < allMedia.length; j++) {
            if (allMedia[j].isExisting) newExisting.push(allMedia[j]);
            else newFiles.push(allMedia[j]);
        }
        this.state.existing = newExisting;
        this.state.files = newFiles;
    },

    reorderPdfItemsComplete: function(draggedId, targetId) {
        var allPdfs = this.state.existingPdfs.filter(function(item) { return !item.markedForDeletion; }).concat(this.state.pdfs);
        var draggedIndex = -1, targetIndex = -1;
        for (var i = 0; i < allPdfs.length; i++) {
            if (allPdfs[i].id === draggedId) draggedIndex = i;
            if (allPdfs[i].id === targetId) targetIndex = i;
        }
        if (draggedIndex === -1 || targetIndex === -1) return;
        var draggedItem = allPdfs[draggedIndex];
        allPdfs.splice(draggedIndex, 1);
        allPdfs.splice(targetIndex, 0, draggedItem);
        var newExistingPdfs = [], newPdfs = [];
        for (var j = 0; j < allPdfs.length; j++) {
            if (allPdfs[j].isExisting) newExistingPdfs.push(allPdfs[j]);
            else newPdfs.push(allPdfs[j]);
        }
        this.state.existingPdfs = newExistingPdfs;
        this.state.pdfs = newPdfs;
    },

    // ========== UTILIDADES ==========
    extractFileName: function(url) {
        if (!url) return 'arquivo';
        try {
            var urlWithoutQuery = url.split('?')[0];
            var parts = urlWithoutQuery.split('/');
            var fileName = parts[parts.length - 1] || 'arquivo';
            try { fileName = decodeURIComponent(fileName); } catch(e) {}
            if (fileName.length > 50) fileName = fileName.substring(0,47)+'...';
            return fileName;
        } catch(e) { return 'arquivo'; }
    },

    reconstructSupabaseUrl: function(filename) {
        if (!filename || typeof filename !== 'string') return null;
        if (filename.startsWith('http')) return filename;
        if (filename.indexOf('.') === -1) return null;
        try {
            var SUPABASE_URL = window.SUPABASE_CONSTANTS.URL;
            var bucket = this.config.buckets[this.config.currentSystem];
            return SUPABASE_URL + '/storage/v1/object/public/' + bucket + '/' + filename;
        } catch(e) { return null; }
    },

    getFileTypeFromUrl: function(url) {
        if (!url) return 'image/jpeg';
        var urlLower = url.toLowerCase();
        if (urlLower.indexOf('.mp4') !== -1 || urlLower.indexOf('.mov') !== -1) return 'video/mp4';
        if (urlLower.indexOf('.jpg') !== -1 || urlLower.indexOf('.jpeg') !== -1) return 'image/jpeg';
        if (urlLower.indexOf('.pdf') !== -1) return 'application/pdf';
        return 'image/jpeg';
    },

    resetState: function() {
        var cleanupBlobUrls = function(items) {
            for (var i = 0; i < items.length; i++) {
                if (items[i].preview && items[i].preview.startsWith('blob:')) URL.revokeObjectURL(items[i].preview);
                if (items[i].blobUrl) URL.revokeObjectURL(items[i].blobUrl);
            }
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

setTimeout(function() {
    window.MediaSystem.init('vendas');
    var isDebug = window.location.search.indexOf('debug=true') !== -1;
    console.log('✅ MediaSystem Core carregado - Lógica essencial + Fallback completo com drag & drop');
    console.log('📦 Modo: ' + (isDebug ? 'DEBUG (UI via Support System)' : 'PRODUÇÃO (fallback completo com drag & drop)'));
    console.log('🔧 Funções escapeHtml e isVideoUrl centralizadas no SharedCore');
    console.log('⚡ Debounce aplicado em addFiles e addPdfs para otimização de performance');
    console.log('🎯 LAYOUT HORIZONTAL - scroll horizontal para previews');
}, 1000);

console.log('✅ media-unified.js CORE - ' + (window.location.search.indexOf('debug=true') !== -1 ? 'Modo DEBUG (UI via Support System)' : 'Modo PRODUÇÃO (fallback completo com drag & drop)'));
