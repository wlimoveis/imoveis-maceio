// js/modules/gallery.js - COM SETAS LIQUID GLASS E ABERTURA NA IMAGEM ATUAL
console.log('🚀 gallery.js carregado - Setas Liquid Glass + abertura na imagem atual');

// ========== VARIÁVEIS GLOBAIS ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// COR CLASSMORPHISM (gradiente azul/rosa)
const CLASSMORPHISM_COLOR = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const CLASSMORPHISM_BG = 'rgba(102, 126, 234, 0.85)';

// ========== FUNÇÃO PARA DETECTAR VÍDEO ==========
window.isVideoUrl = function(url) {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.includes('.mp4') || 
           urlLower.includes('.mov') || 
           urlLower.includes('.webm') || 
           urlLower.includes('.avi');
};

// ========== FUNÇÃO PARA CRIAR MINIATURA DE VÍDEO ==========
window.createVideoThumbnail = function(videoUrl, index, propertyId) {
    return `
        <div class="gallery-video-item" 
             data-video-url="${videoUrl}"
             data-index="${index}"
             style="position:relative; cursor:pointer; width:100%; height:100%;">
            <div style="position:relative; width:100%; height:100%; background:#1a1a2e;">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); 
                            background:rgba(0,0,0,0.7); border-radius:50%; width:50px; height:50px;
                            display:flex; align-items:center; justify-content:center; z-index:10;">
                    <i class="fas fa-play" style="color:white; font-size:24px; margin-left:4px;"></i>
                </div>
                <video style="width:100%; height:100%; object-fit:cover; filter:brightness(0.7);" 
                       preload="metadata" muted>
                    <source src="${videoUrl}" type="video/mp4">
                    <source src="${videoUrl}" type="video/quicktime">
                </video>
                <div style="position:absolute; bottom:5px; right:5px; background:${CLASSMORPHISM_BG}; 
                            color:white; padding:2px 6px; border-radius:3px; font-size:0.7rem;">
                    <i class="fas fa-video"></i> Vídeo
                </div>
            </div>
        </div>
    `;
};

// ========== FUNÇÃO PARA CRIAR MINIATURA DE IMAGEM ==========
window.createImageThumbnail = function(imageUrl, index) {
    return `
        <div class="gallery-image-item" data-index="${index}" style="width:100%; height:100%;">
            <img src="${imageUrl}" 
                 style="width:100%; height:100%; object-fit:cover;"
                 onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
        </div>
    `;
};

// ========== FUNÇÃO PARA GERAR SETAS LIQUID GLASS ==========
function createNavigationArrows(propertyId, totalItems, currentIndex) {
    if (totalItems <= 1) return '';
    
    return `
        <button class="gallery-nav-arrow gallery-nav-prev" 
                onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${propertyId}, 'prev')"
                style="position:absolute; left:10px; top:50%; transform:translateY(-50%); 
                       width:40px; height:40px; border-radius:50%; 
                       background:rgba(255,255,255,0.2); 
                       backdrop-filter:blur(8px);
                       border:1px solid rgba(255,255,255,0.3);
                       color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                       font-size:18px; transition:all 0.3s ease; z-index:25;
                       box-shadow:0 2px 10px rgba(0,0,0,0.2);">
            <i class="fas fa-chevron-left"></i>
        </button>
        <button class="gallery-nav-arrow gallery-nav-next" 
                onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${propertyId}, 'next')"
                style="position:absolute; right:10px; top:50%; transform:translateY(-50%); 
                       width:40px; height:40px; border-radius:50%; 
                       background:rgba(255,255,255,0.2); 
                       backdrop-filter:blur(8px);
                       border:1px solid rgba(255,255,255,0.3);
                       color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                       font-size:18px; transition:all 0.3s ease; z-index:25;
                       box-shadow:0 2px 10px rgba(0,0,0,0.2);">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
}

// ========== FUNÇÃO PARA OBTER ÍNDICE ATUAL DO CARD ==========
function getCurrentCardIndex(propertyId) {
    const cardContainer = document.querySelector(`[data-property-id="${propertyId}"] .property-gallery-container`);
    if (cardContainer && cardContainer.dataset.currentIndex) {
        return parseInt(cardContainer.dataset.currentIndex);
    }
    return 0;
}

// ========== FUNÇÃO PARA INCREMENTAR CONTADOR DE VISUALIZAÇÃO ==========
function incrementGalleryViewCounter(propertyId) {
    try {
        // Recupera contador atual do localStorage ou inicializa
        const storageKey = `gallery_views_${propertyId}`;
        let currentViews = localStorage.getItem(storageKey);
        let views = currentViews ? parseInt(currentViews) : 0;
        
        // Incrementa
        views++;
        localStorage.setItem(storageKey, views);
        
        // Atualiza display no card se existir
        const viewCounterElement = document.querySelector(`[data-property-id="${propertyId}"] .gallery-view-counter`);
        if (viewCounterElement) {
            viewCounterElement.innerHTML = `<i class="fas fa-eye"></i> ${views}`;
        }
        
        return views;
    } catch(e) {
        console.warn('Erro ao incrementar contador de visualização:', e);
        return 0;
    }
}

// ========== FUNÇÃO PARA OBTER CONTADOR DE VISUALIZAÇÃO ==========
function getGalleryViewCount(propertyId) {
    try {
        const storageKey = `gallery_views_${propertyId}`;
        const views = localStorage.getItem(storageKey);
        return views ? parseInt(views) : 0;
    } catch(e) {
        return 0;
    }
}

// ========== FUNÇÃO PARA NAVEGAR NA GALERIA DO PROPRIEDADE (SEM ABRIR MODAL) ==========
window.navigatePropertyGallery = function(propertyId, direction) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    if (allMedia.length <= 1) return;
    
    // Obter índice atual do card
    let currentIndex = getCurrentCardIndex(propertyId);
    
    // Calcular novo índice
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % allMedia.length;
    } else {
        currentIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    }
    
    // Atualizar o card com a nova mídia
    updateCardMedia(propertyId, currentIndex);
};

// ========== FUNÇÃO PARA ATUALIZAR O CARD COM NOVA MÍDIA ==========
function updateCardMedia(propertyId, newIndex) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    if (newIndex < 0 || newIndex >= allMedia.length) return;
    
    const mediaUrl = allMedia[newIndex];
    const isVideo = window.isVideoUrl(mediaUrl);
    
    const propertyCard = document.querySelector(`[data-property-id="${propertyId}"]`);
    if (!propertyCard) return;
    
    const galleryContainer = propertyCard.querySelector('.property-gallery-container');
    const mainContent = galleryContainer.querySelector('div:first-child');
    
    if (mainContent) {
        if (isVideo) {
            mainContent.outerHTML = window.createVideoThumbnail(mediaUrl, newIndex, propertyId);
        } else {
            mainContent.outerHTML = window.createImageThumbnail(mediaUrl, newIndex);
        }
    }
    
    // Atualizar dots
    const dots = galleryContainer.querySelectorAll('.gallery-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === newIndex);
    });
    
    // Atualizar contador mobile
    const mobileIndicator = galleryContainer.querySelector('.gallery-indicator-mobile span');
    if (mobileIndicator) {
        mobileIndicator.textContent = `${newIndex + 1}/${allMedia.length}`;
    }
    
    // Atualizar o dataset com o novo índice
    if (galleryContainer) {
        galleryContainer.dataset.currentIndex = newIndex;
    }
}

// ========== FUNÇÃO PRINCIPAL: Criar galeria COM SETAS ==========
window.createPropertyGallery = function(property) {
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    
    const allMediaUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
    const totalMediaCount = allMediaUrls.length;
    const hasVideos = allMediaUrls.some(url => window.isVideoUrl(url));
    const currentIndex = 0;
    
    const firstMediaUrl = allMediaUrls.length > 0 ? allMediaUrls[0] : 
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    const firstIsVideo = window.isVideoUrl(firstMediaUrl);
    
    // Obter contador de visualizações atual
    const currentViews = getGalleryViewCount(property.id);
    
    // Gerar dots com cor ClassMorphism
    const dotsHtml = allMediaUrls.map((url, idx) => {
        const isVideo = window.isVideoUrl(url);
        const icon = isVideo ? '<i class="fas fa-video" style="font-size:0.6rem;"></i>' : '';
        return `
            <div class="gallery-dot ${idx === 0 ? 'active' : ''}" 
                 data-index="${idx}"
                 onclick="event.stopPropagation(); event.preventDefault(); updateCardMedia(${property.id}, ${idx})"
                 style="background: ${isVideo ? CLASSMORPHISM_COLOR : 'rgba(255,255,255,0.5)'};">
                ${icon}
            </div>
        `;
    }).join('');
    
    // Gerar setas de navegação (Liquid Glass)
    const arrowsHtml = totalMediaCount > 1 ? createNavigationArrows(property.id, totalMediaCount, currentIndex) : '';
    
    // IMPORTANTE: onclick do container agora passa o índice atual
    const containerHtml = `
        <div class="property-image ${property.rural ? 'rural-image' : ''}" 
             style="position: relative; height: 250px;"
             data-property-id="${property.id}">
            <div class="property-gallery-container" 
                 onclick="openGalleryAtCurrentIndex(${property.id})" 
                 style="cursor:pointer; position:relative;"
                 data-current-index="0">
                
                ${firstIsVideo ? 
                    window.createVideoThumbnail(firstMediaUrl, 0, property.id) :
                    window.createImageThumbnail(firstMediaUrl, 0)
                }
                
                <!-- SETAS LIQUID GLASS -->
                ${arrowsHtml}
                
                <!-- INDICADOR MOBILE -->
                <div class="gallery-indicator-mobile">
                    <i class="fas fa-images"></i>
                    <span>1/${totalMediaCount}</span>
                </div>
                
                <!-- DOTS (indicadores) -->
                ${totalMediaCount > 1 ? `
                    <div class="gallery-controls" style="display:flex; justify-content:center; gap:6px; margin-top:5px;">
                        ${dotsHtml}
                    </div>
                ` : ''}
                
                <!-- CONTADOR DE VISUALIZAÇÃO DA GALERIA (SUBSTITUI O .media-count ANTERIOR) -->
                <div class="gallery-view-counter" 
                     style="position:absolute; bottom:5px; left:5px; 
                            background: ${CLASSMORPHISM_BG};
                            color:white; padding:3px 8px; border-radius:15px; 
                            font-size:0.7rem; font-weight:500; z-index:15;
                            backdrop-filter:blur(4px);
                            box-shadow:0 1px 4px rgba(0,0,0,0.2);">
                    <i class="fas fa-eye"></i> ${currentViews}
                </div>
                
                <!-- ÍCONE EXPANDIR (COR CLASSMORPHISM) -->
                <div class="gallery-expand-icon" 
                     onclick="event.stopPropagation(); openGalleryAtCurrentIndex(${property.id})"
                     style="position:absolute; top:10px; right:10px; 
                            background: ${CLASSMORPHISM_BG};
                            width:32px; height:32px; border-radius:50%;
                            display:flex; align-items:center; justify-content:center;
                            cursor:pointer; transition:all 0.3s ease; z-index:20;
                            backdrop-filter:blur(4px);
                            box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                    <i class="fas fa-expand" style="color:white; font-size:14px;"></i>
                </div>
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
            
            ${hasVideos ? `<div class="video-indicator" style="position:absolute; top:10px; right:50px; background:${CLASSMORPHISM_BG}; color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; z-index:20; backdrop-filter:blur(4px);">
                <i class="fas fa-video"></i> Vídeo
            </div>` : ''}
            
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                    style="position: absolute; bottom: 2px; right: 35px; background: ${CLASSMORPHISM_BG}; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: white; transition: all 0.3s ease; z-index:15; backdrop-filter:blur(4px); box-shadow: 0 2px 6px rgba(0,0,0,0.3);"
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf"></i>
                </button>` : ''}
            
            <!-- O ANTIGO .media-count FOI REMOVIDO E SUBSTITUÍDO PELO .gallery-view-counter ACIMA -->
        </div>
    `;
    
    return containerHtml;
};

// ========== NOVA FUNÇÃO: Abrir galeria na imagem atual (com incremento de visualização) ==========
window.openGalleryAtCurrentIndex = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    
    // INCREMENTA CONTADOR DE VISUALIZAÇÃO AO ABRIR A GALERIA
    const newViewCount = incrementGalleryViewCounter(propertyId);
    
    // Obter o índice atual do card
    const currentIndex = getCurrentCardIndex(propertyId);
    
    // Configurar a galeria para abrir no índice atual
    window.currentGalleryImages = allMedia;
    window.currentGalleryIndex = currentIndex;  // ÍNDICE CORRETO!
    
    let galleryModal = document.getElementById('propertyGalleryModal');
    
    if (!galleryModal) {
        galleryModal = document.createElement('div');
        galleryModal.id = 'propertyGalleryModal';
        galleryModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 199999;
            display: none;
        `;
        galleryModal.innerHTML = `
            <div style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                <div class="gallery-swipe-area" style="position:absolute; top:0; left:0; width:100%; height:100%;"
                     ontouchstart="handleTouchStart(event)"
                     ontouchend="handleTouchEnd(event)"></div>
                
                <div id="galleryCurrentMedia" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
                </div>
                
                <div style="position:fixed; bottom:20px; left:0; right:0; display:flex; justify-content:center; gap:20px; z-index:200001;">
                    <button class="gallery-modal-btn" onclick="prevGalleryImage()" style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div id="galleryCounter" class="gallery-counter" style="background:${CLASSMORPHISM_BG}; color:white; padding:12px 20px; border-radius:25px; font-size:16px; backdrop-filter:blur(4px);">${currentIndex + 1} / ${window.currentGalleryImages.length}</div>
                    <button class="gallery-modal-btn" onclick="nextGalleryImage()" style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <button class="gallery-modal-close" onclick="closeGallery()" style="position:fixed; top:20px; right:20px; background:${CLASSMORPHISM_BG}; color:white; border:none; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size:20px; z-index:200001; backdrop-filter:blur(4px);">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(galleryModal);
    } else {
        // Atualizar contador se o modal já existir
        const counterElement = document.getElementById('galleryCounter');
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1} / ${window.currentGalleryImages.length}`;
        }
    }
    
    updateGalleryModalMedia();
    galleryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// ========== ATUALIZAR MODAL (APROVEITAMENTO TOTAL DO ESPAÇO) ==========
function updateGalleryModalMedia() {
    const container = document.getElementById('galleryCurrentMedia');
    const counterElement = document.getElementById('galleryCounter');
    
    if (!container || !window.currentGalleryImages.length) return;
    
    const currentUrl = window.currentGalleryImages[window.currentGalleryIndex];
    const isVideo = window.isVideoUrl(currentUrl);
    
    if (isVideo) {
        container.innerHTML = `
            <div style="width:100%; height:100%; background:#000; display:flex; align-items:center; justify-content:center;">
                <video id="galleryVideo" 
                       style="width:100%; height:100%; object-fit:contain;"
                       autoplay
                       loop
                       controls
                       controlslist="nodownload">
                    <source src="${currentUrl}" type="video/mp4">
                    <source src="${currentUrl}" type="video/quicktime">
                    Seu navegador não suporta vídeo.
                </video>
            </div>
        `;
        
        const video = document.getElementById('galleryVideo');
        if (video) {
            video.loop = true;
            video.play().catch(e => console.log('Autoplay bloqueado:', e));
        }
    } else {
        container.innerHTML = `
            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000;">
                <img src="${currentUrl}" 
                     style="width:100%; height:100%; object-fit:contain;"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
            </div>
        `;
    }
    
    if (counterElement) {
        counterElement.textContent = `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
    }
}

// ========== NAVEGAÇÃO MODAL ==========
window.nextGalleryImage = function() {
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) currentVideo.pause();
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

window.prevGalleryImage = function() {
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) currentVideo.pause();
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

// ========== FECHAR GALERIA ==========
window.closeGallery = function() {
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = '';
    }
    
    const galleryModal = document.getElementById('propertyGalleryModal');
    if (galleryModal) {
        galleryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ========== TOUCH/SWIPE ==========
window.handleTouchStart = function(event) {
    window.touchStartX = event.changedTouches[0].screenX;
    event.stopPropagation();
};

window.handleTouchEnd = function(event) {
    window.touchEndX = event.changedTouches[0].screenX;
    const diff = window.touchStartX - window.touchEndX;
    if (diff > window.SWIPE_THRESHOLD) window.nextGalleryImage();
    else if (diff < -window.SWIPE_THRESHOLD) window.prevGalleryImage();
    event.stopPropagation();
};

// ========== CONFIGURAR EVENTOS ==========
window.setupGalleryEvents = function() {
    document.addEventListener('click', function(event) {
        const galleryModal = document.getElementById('propertyGalleryModal');
        if (galleryModal && galleryModal.style.display === 'block' && event.target === galleryModal) {
            window.closeGallery();
        }
    });
    
    document.addEventListener('keydown', function(event) {
        const galleryModal = document.getElementById('propertyGalleryModal');
        if (!galleryModal || galleryModal.style.display !== 'block') return;
        switch(event.key) {
            case 'ArrowLeft': event.preventDefault(); window.prevGalleryImage(); break;
            case 'ArrowRight': event.preventDefault(); window.nextGalleryImage(); break;
            case 'Escape': event.preventDefault(); window.closeGallery(); break;
        }
    });
    
    // Adicionar CSS hover para as setas
    const style = document.createElement('style');
    style.textContent = `
        .gallery-nav-arrow:hover {
            background: rgba(255,255,255,0.35) !important;
            transform: translateY(-50%) scale(1.1) !important;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3) !important;
        }
        .gallery-nav-arrow:active {
            transform: translateY(-50%) scale(0.95) !important;
        }
        .gallery-expand-icon:hover {
            transform: scale(1.1);
            background: rgba(102, 126, 234, 1) !important;
        }
        .gallery-view-counter {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            letter-spacing: 0.3px;
        }
    `;
    document.head.appendChild(style);
};

// Manter compatibilidade com a função antiga (se necessário)
window.openGallery = window.openGalleryAtCurrentIndex;

console.log('✅ gallery.js carregado - Contador de visualização implementado com ClassMorphism!');
