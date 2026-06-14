// js/modules/gallery.js - COM SETAS LIQUID GLASS, CONTADOR PERSISTENTE E TIMESTAMPS
// ✅ Funções de visualização delegadas ao SharedCore
console.log('🚀 gallery.js carregado - Setas Liquid Glass + Contador Persistente com Timestamps');

// ========== VARIÁVEIS GLOBAIS ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// ========== FUNÇÃO PARA DETECTAR VÍDEO - CENTRALIZADA NO SHAREDCORE ==========
// A função window.isVideoUrl é fornecida globalmente pelo SharedCore.js

// ========== FUNÇÕES DELEGADAS PARA O SHAREDCORE (COM FALLBACK) ==========

window.getGalleryViews = function(propertyId) {
    if (window.SharedCore && typeof window.SharedCore.getGalleryViews === 'function') {
        return window.SharedCore.getGalleryViews(propertyId);
    }
    console.warn('[Gallery] SharedCore não disponível, usando fallback local para getGalleryViews');
    try {
        const views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        return views[propertyId] || 0;
    } catch (error) {
        return 0;
    }
};

window.getTotalGalleryViews = function() {
    if (window.SharedCore && typeof window.SharedCore.getTotalGalleryViews === 'function') {
        return window.SharedCore.getTotalGalleryViews();
    }
    console.warn('[Gallery] SharedCore não disponível, usando fallback local para getTotalGalleryViews');
    try {
        const views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        let total = 0;
        for (let key in views) total += views[key];
        return total;
    } catch (error) {
        return 0;
    }
};

window.getLastGalleryView = function(propertyId) {
    if (window.SharedCore && typeof window.SharedCore.getLastGalleryView === 'function') {
        return window.SharedCore.getLastGalleryView(propertyId);
    }
    console.warn('[Gallery] SharedCore não disponível, usando fallback local para getLastGalleryView');
    try {
        const lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        return lastViews[propertyId] || null;
    } catch (error) {
        return null;
    }
};

window.resetAllGalleryViews = function() {
    if (window.SharedCore && typeof window.SharedCore.resetAllGalleryViews === 'function') {
        const result = window.SharedCore.resetAllGalleryViews();
        if (result && typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 100);
        }
        return result;
    }
    console.error('[Gallery] SharedCore não disponível para resetAllGalleryViews. Operação não realizada.');
    alert('❌ Sistema de visualizações não disponível. Recarregue a página.');
    return false;
};

window.resetGalleryViews = function(propertyId, propertyTitle) {
    if (!confirm(`⚠️ TEM CERTEZA que deseja ZERAR as visualizações do imóvel?\n\n"${propertyTitle}"\n\nEsta ação NÃO pode ser desfeita.`)) {
        return false;
    }
    try {
        let views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        let lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        
        views[propertyId] = 0;
        lastViews[propertyId] = new Date().toISOString();
        
        localStorage.setItem('galleryViews', JSON.stringify(views));
        localStorage.setItem('galleryViewsLast', JSON.stringify(lastViews));
        
        updateViewCounter(propertyId, 0);
        
        if (typeof window.loadPropertyList === 'function') {
            setTimeout(() => window.loadPropertyList(), 100);
        }
        
        if (typeof window.showAdminNotification === 'function') {
            window.showAdminNotification(`✅ Visualizações de "${propertyTitle}" zeradas com sucesso!`, 'success', 3000);
        } else {
            alert(`✅ Visualizações de "${propertyTitle}" zeradas com sucesso!`);
        }
        return true;
    } catch (error) {
        console.error('Erro ao zerar visualizações:', error);
        alert('❌ Erro ao zerar visualizações!');
        return false;
    }
};

// ========== FUNÇÃO PARA REGISTRAR VISUALIZAÇÃO (PERSISTENTE) ==========
window.registerGalleryView = function(propertyId) {
    try {
        let views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        views[propertyId] = (views[propertyId] || 0) + 1;
        localStorage.setItem('galleryViews', JSON.stringify(views));
        
        let lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        lastViews[propertyId] = new Date().toISOString();
        localStorage.setItem('galleryViewsLast', JSON.stringify(lastViews));
        
        updateViewCounter(propertyId, views[propertyId]);
        
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel && adminPanel.style.display === 'block') {
            if (typeof window.loadPropertyList === 'function') {
                setTimeout(() => window.loadPropertyList(), 100);
            }
        }
        
        console.log(`👁️ Visualização registrada para imóvel ${propertyId}: ${views[propertyId]} total`);
        return views[propertyId];
    } catch (error) {
        console.error('Erro ao registrar visualização:', error);
        return 0;
    }
};

// ========== FUNÇÃO PARA ATUALIZAR CONTADOR VISUAL ==========
function updateViewCounter(propertyId, count) {
    const propertyCard = document.querySelector(`.property-card[data-property-id="${propertyId}"]`);
    if (!propertyCard) return;
    
    const viewCounter = propertyCard.querySelector('.gallery-view-counter span');
    if (viewCounter) {
        viewCounter.textContent = count;
    }
}

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
                <div style="position:absolute; bottom:5px; right:5px; background:rgba(0,0,0,0.6); 
                            color:white; padding:2px 6px; border-radius:3px; font-size:0.7rem;">
                    <i class="fas fa-video"></i> Vídeo
                </div>
            </div>
        </div>
    `;
};

// ========== FUNÇÃO PARA CRIAR MINIATURA DE IMAGEM (COM LAZY LOADING) ==========
window.createImageThumbnail = function(imageUrl, index) {
    return `
        <div class="gallery-image-item" data-index="${index}" style="width:100%; height:100%;">
            <img src="${imageUrl}" 
                 loading="lazy"
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

// ========== FUNÇÃO PARA NAVEGAR NA GALERIA ==========
window.navigatePropertyGallery = function(propertyId, direction) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    if (allMedia.length <= 1) return;
    
    let currentIndex = getCurrentCardIndex(propertyId);
    
    if (direction === 'next') {
        currentIndex = (currentIndex + 1) % allMedia.length;
    } else {
        currentIndex = (currentIndex - 1 + allMedia.length) % allMedia.length;
    }
    
    updateCardMedia(propertyId, currentIndex);
};

// ========== FUNÇÃO PARA ATUALIZAR O CARD ==========
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
    
    const dots = galleryContainer.querySelectorAll('.gallery-dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === newIndex);
    });
    
    const mobileIndicator = galleryContainer.querySelector('.gallery-indicator-mobile span');
    if (mobileIndicator) {
        mobileIndicator.textContent = `${newIndex + 1}/${allMedia.length}`;
    }
    
    if (galleryContainer) {
        galleryContainer.dataset.currentIndex = newIndex;
    }
}

// ========== FUNÇÃO PRINCIPAL: Criar galeria ==========
window.createPropertyGallery = function(property) {
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    
    const allMediaUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
    const totalMediaCount = allMediaUrls.length;
    const hasVideos = allMediaUrls.some(url => window.isVideoUrl(url));
    const currentIndex = 0;
    
    const viewCount = window.getGalleryViews(property.id);
    
    const firstMediaUrl = allMediaUrls.length > 0 ? allMediaUrls[0] : 
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    const firstIsVideo = window.isVideoUrl(firstMediaUrl);
    
    const dotsHtml = allMediaUrls.map((url, idx) => {
        const isVideo = window.isVideoUrl(url);
        const icon = isVideo ? '<i class="fas fa-video" style="font-size:0.6rem;"></i>' : '';
        return `
            <div class="gallery-dot ${idx === 0 ? 'active' : ''}" 
                 data-index="${idx}"
                 onclick="event.stopPropagation(); event.preventDefault(); updateCardMedia(${property.id}, ${idx})"
                 style="${isVideo ? 'background:#9b59b6;' : ''}">
                ${icon}
            </div>
        `;
    }).join('');
    
    const arrowsHtml = totalMediaCount > 1 ? createNavigationArrows(property.id, totalMediaCount, currentIndex) : '';
    
    const viewCounterHtml = `
    <div class="gallery-view-counter">
        <i class="fas fa-eye"></i>
        <span>${viewCount}</span>
    </div>
`;

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
                
                ${arrowsHtml}
                
                <div class="gallery-indicator-mobile">
                    <i class="fas fa-images"></i>
                    <span>1/${totalMediaCount}</span>
                </div>
                
                ${totalMediaCount > 1 ? `
                    <div class="gallery-controls" style="display:flex; justify-content:center; gap:6px; margin-top:5px;">
                        ${dotsHtml}
                    </div>
                ` : ''}
                
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGalleryAtCurrentIndex(${property.id})">
                    <i class="fas fa-expand"></i>
                </div>
                
                ${viewCounterHtml}
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                                  
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                    style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf"></i>
                </button>` : ''}
        </div>
    `;
    
    return containerHtml;
};

// ========== ABRIR GALERIA COM REGISTRO DE VISUALIZAÇÃO ==========
window.openGalleryAtCurrentIndex = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    
    window.registerGalleryView(propertyId);
    
    const currentIndex = getCurrentCardIndex(propertyId);
    
    window.currentGalleryImages = allMedia;
    window.currentGalleryIndex = currentIndex;
    
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
                    <div id="galleryCounter" class="gallery-counter" style="background:rgba(0,0,0,0.7); color:white; padding:12px 20px; border-radius:25px; font-size:16px;">${currentIndex + 1} / ${window.currentGalleryImages.length}</div>
                    <button class="gallery-modal-btn" onclick="nextGalleryImage()" style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <button class="gallery-modal-close" onclick="closeGallery()" style="position:fixed; top:20px; right:20px; background:rgba(0,0,0,0.7); color:white; border:none; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size:20px; z-index:200001;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        document.body.appendChild(galleryModal);
    } else {
        const counterElement = document.getElementById('galleryCounter');
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1} / ${window.currentGalleryImages.length}`;
        }
    }
    
    updateGalleryModalMedia();
    galleryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// ========== ATUALIZAR MODAL ==========
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
                     loading="lazy"
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

// ========== CONFIGURAR EVENTOS (COM DEBOUNCE E THROTTLE) ==========
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
    
    let resizeTimeout;
    window.addEventListener('resize', function() {
        if (resizeTimeout) clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            const galleryModal = document.getElementById('propertyGalleryModal');
            if (galleryModal && galleryModal.style.display === 'block') {
                const currentVideo = document.getElementById('galleryVideo');
                if (currentVideo) {
                    currentVideo.style.maxHeight = window.innerHeight * 0.8 + 'px';
                }
            }
            console.log('🖼️ Galeria ajustada após resize (debounced)');
        }, 250);
    });
    
    let scrollThrottleTimeout = null;
    let lastScrollPosition = 0;
    
    window.addEventListener('scroll', function() {
        if (scrollThrottleTimeout) return;
        scrollThrottleTimeout = setTimeout(function() {
            scrollThrottleTimeout = null;
            const currentScroll = window.scrollY;
            const scrollDelta = Math.abs(currentScroll - lastScrollPosition);
            if (scrollDelta > 100) {
                const lazyImages = document.querySelectorAll('img[loading="lazy"]');
                if (lazyImages.length > 0 && window.DEBUG_MODE) {
                    console.log(`📜 Scroll detectado: ${lazyImages.length} imagens lazy aguardando`);
                }
            }
            lastScrollPosition = currentScroll;
        }, 100);
    });
    
    console.log('✅ Throttle de scroll configurado');
    
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
        
        .gallery-view-counter:hover {
            background: rgba(255, 255, 255, 0.35) !important;
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .gallery-view-counter i {
            transition: transform 0.3s ease;
        }
        
        .gallery-view-counter:hover i {
            transform: scale(1.2);
        }
    `;
    document.head.appendChild(style);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupGalleryEvents);
} else {
    window.setupGalleryEvents();
}

window.openGallery = window.openGalleryAtCurrentIndex;

console.log('✅ gallery.js carregado - Contador Persistente com Timestamps!');
console.log('✅ Otimizações: lazy loading, debounce resize, throttle scroll');
console.log('✅ Funções de visualização delegadas ao SharedCore');
