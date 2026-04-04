// js/modules/gallery.js - Sistema de galeria de fotos (CORE) COM FILTRO DE VÍDEOS
console.log('🚀 gallery.js carregado - Versão core com filtro de vídeos');

// ========== VARIÁVEIS GLOBAIS ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// ========== FUNÇÃO AUXILIAR PARA DETECTAR VÍDEO ==========
window.isVideoUrl = function(url) {
    if (!url) return false;
    const urlLower = url.toLowerCase();
    return urlLower.includes('.mp4') || 
           urlLower.includes('.mov') || 
           urlLower.includes('.webm') || 
           urlLower.includes('.avi');
};

// ========== FUNÇÕES ESSENCIAIS DA GALERIA ==========

// Criar galeria no card do imóvel
window.createPropertyGallery = function(property) {
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    const allMediaUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
    
    // Filtrar apenas imagens (excluir vídeos)
    const imageUrls = allMediaUrls.filter(url => !window.isVideoUrl(url));
    const videoUrls = allMediaUrls.filter(url => window.isVideoUrl(url));
    
    const firstImageUrl = imageUrls.length > 0 ? imageUrls[0] : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    // Imagem única
    if (imageUrls.length <= 1) {
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <div class="property-gallery-container" onclick="openGallery(${property.id})">
                    <img src="${firstImageUrl}" class="property-gallery-image" alt="${property.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                </div>
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                
                ${property.has_video || videoUrls.length > 0 ? `<div class="video-indicator"><i class="fas fa-video"></i><span>TEM VÍDEO</span></div>` : ''}
                
                ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                    `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id})"
                            style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                            title="Documentos do imóvel (senha: doc123)">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
                
                ${imageUrls.length > 0 ? `<div class="image-count">${imageUrls.length}</div>` : ''}
            </div>`;
    }
    
    // Múltiplas imagens
    return `
        <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
            <div class="property-gallery-container" onclick="openGallery(${property.id})">
                <img src="${firstImageUrl}" class="property-gallery-image" alt="${property.title}"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
                
                <div class="gallery-indicator-mobile"><i class="fas fa-images"></i><span>${imageUrls.length}</span></div>
                
                <div class="gallery-controls">
                    ${imageUrls.map((_, index) => `
                        <div class="gallery-dot ${index === 0 ? 'active' : ''}" data-index="${index}"
                             onclick="event.stopPropagation(); event.preventDefault(); showGalleryImage(${property.id}, ${index})"></div>
                    `).join('')}
                </div>
                
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGallery(${property.id})">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
            
            ${property.has_video || videoUrls.length > 0 ? `<div class="video-indicator"><i class="fas fa-video"></i><span>TEM VÍDEO</span></div>` : ''}
            
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                    style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf"></i>
                </button>` : ''}
        </div>`;
};

// Abrir galeria (com filtro de vídeos)
window.openGallery = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    // Filtrar apenas arquivos de IMAGEM (excluir vídeos da galeria)
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    
    // Separar imagens de vídeos
    const imageUrls = allMedia.filter(url => !window.isVideoUrl(url));
    const videoUrls = allMedia.filter(url => window.isVideoUrl(url));
    
    // Se não houver imagens, tentar usar o primeiro vídeo
    if (imageUrls.length === 0 && videoUrls.length > 0) {
        // Abrir vídeo diretamente em nova aba
        window.open(videoUrls[0], '_blank');
        return;
    }
    
    // Se não houver imagens nem vídeos, sair
    if (imageUrls.length === 0) return;
    
    window.currentGalleryImages = imageUrls; // Apenas imagens na galeria
    window.currentGalleryIndex = 0;
    
    let galleryModal = document.getElementById('propertyGalleryModal');
    
    if (!galleryModal) {
        galleryModal = document.createElement('div');
        galleryModal.id = 'propertyGalleryModal';
        galleryModal.className = 'gallery-modal';
        galleryModal.innerHTML = `
            <div class="gallery-modal-content">
                <div class="gallery-swipe-area" 
                     ontouchstart="handleTouchStart(event)"
                     ontouchend="handleTouchEnd(event)"></div>
                
                <img id="galleryCurrentImage" class="gallery-modal-image" 
                     src="${window.currentGalleryImages[0]}"
                     alt="Imagem 1 de ${window.currentGalleryImages.length}">
                
                <div class="gallery-modal-controls">
                    <button class="gallery-modal-btn" onclick="prevGalleryImage()"><i class="fas fa-chevron-left"></i></button>
                    <div id="galleryCounter" class="gallery-counter">1 / ${window.currentGalleryImages.length}</div>
                    <button class="gallery-modal-btn" onclick="nextGalleryImage()"><i class="fas fa-chevron-right"></i></button>
                </div>
                
                <button class="gallery-modal-close" onclick="closeGallery()"><i class="fas fa-times"></i></button>
            </div>`;
        document.body.appendChild(galleryModal);
    } else {
        document.getElementById('galleryCurrentImage').src = window.currentGalleryImages[0];
        document.getElementById('galleryCounter').textContent = `1 / ${window.currentGalleryImages.length}`;
    }
    
    galleryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        const closeBtn = galleryModal.querySelector('.gallery-modal-close');
        if (closeBtn) closeBtn.focus();
    }, 100);
};

// Fechar galeria
window.closeGallery = function() {
    const galleryModal = document.getElementById('propertyGalleryModal');
    if (galleryModal) {
        galleryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        window.currentGalleryImages = [];
        window.currentGalleryIndex = 0;
    }
};

// Mostrar imagem específica
window.showGalleryImage = function(propertyId, index) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    const images = allMedia.filter(url => !window.isVideoUrl(url));
    
    if (index < 0 || index >= images.length) return;
    
    const container = document.querySelector(`[onclick="openGallery(${propertyId})"]`);
    if (container) {
        const img = container.querySelector('.property-gallery-image');
        if (img) {
            img.src = images[index];
            img.onerror = function() {
                this.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
            };
        }
        
        const dots = container.querySelectorAll('.gallery-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
};

// Navegação
window.nextGalleryImage = function() {
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    updateGalleryModal();
};

window.prevGalleryImage = function() {
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    updateGalleryModal();
};

function updateGalleryModal() {
    const imageElement = document.getElementById('galleryCurrentImage');
    const counterElement = document.getElementById('galleryCounter');
    
    if (imageElement && counterElement) {
        imageElement.src = window.currentGalleryImages[window.currentGalleryIndex];
        counterElement.textContent = `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
        imageElement.style.opacity = '0';
        setTimeout(() => imageElement.style.opacity = '1', 50);
    }
}

// Touch/Swipe
window.handleTouchStart = function(event) {
    window.touchStartX = event.changedTouches[0].screenX;
    event.stopPropagation();
};

window.handleTouchEnd = function(event) {
    window.touchEndX = event.changedTouches[0].screenX;
    handleSwipe();
    event.stopPropagation();
};

function handleSwipe() {
    const diff = window.touchStartX - window.touchEndX;
    if (diff > window.SWIPE_THRESHOLD) {
        window.nextGalleryImage();
    } else if (diff < -window.SWIPE_THRESHOLD) {
        window.prevGalleryImage();
    }
}

// Configurar eventos
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
    
    document.addEventListener('touchstart', window.handleTouchStart, { passive: true });
    document.addEventListener('touchend', window.handleTouchEnd, { passive: true });
    
    document.addEventListener('gesturestart', function(event) {
        const galleryModal = document.getElementById('propertyGalleryModal');
        if (galleryModal && galleryModal.style.display === 'block') event.preventDefault();
    });
};

// Inicialização automática (chamada pelo main.js)
if (typeof window.setupGalleryEvents === 'function') {
    // A configuração será feita pelo main.js
}

console.log('✅ gallery.js core carregado com filtro de vídeos');
