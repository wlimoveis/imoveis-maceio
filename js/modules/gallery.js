// js/modules/gallery.js - VERSÃO OTIMIZADA
console.log('🚀 gallery.js carregado');

// ===== VARIÁVEIS GLOBAIS =====
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// ===== FUNÇÕES DE VISUALIZAÇÃO (DELEGADAS AO SHAREDCORE) =====
window.getGalleryViews = function(propertyId) {
    if (window.SharedCore?.getGalleryViews) return window.SharedCore.getGalleryViews(propertyId);
    try {
        const views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        return views[propertyId] || 0;
    } catch { return 0; }
};

window.getTotalGalleryViews = function() {
    if (window.SharedCore?.getTotalGalleryViews) return window.SharedCore.getTotalGalleryViews();
    try {
        const views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        return Object.values(views).reduce((a,b) => a + b, 0);
    } catch { return 0; }
};

window.getLastGalleryView = function(propertyId) {
    if (window.SharedCore?.getLastGalleryView) return window.SharedCore.getLastGalleryView(propertyId);
    try {
        const lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        return lastViews[propertyId] || null;
    } catch { return null; }
};

window.resetGalleryViews = function(propertyId, propertyTitle) {
    if (!confirm(`⚠️ Zerar visualizações de "${propertyTitle}"?`)) return false;
    try {
        let views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        let lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        views[propertyId] = 0;
        lastViews[propertyId] = new Date().toISOString();
        localStorage.setItem('galleryViews', JSON.stringify(views));
        localStorage.setItem('galleryViewsLast', JSON.stringify(lastViews));
        if (typeof window.loadPropertyList === 'function') setTimeout(() => window.loadPropertyList(), 100);
        alert(`✅ Visualizações de "${propertyTitle}" zeradas!`);
        return true;
    } catch { return false; }
};

window.registerGalleryView = function(propertyId) {
    try {
        let views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        views[propertyId] = (views[propertyId] || 0) + 1;
        localStorage.setItem('galleryViews', JSON.stringify(views));
        let lastViews = JSON.parse(localStorage.getItem('galleryViewsLast') || '{}');
        lastViews[propertyId] = new Date().toISOString();
        localStorage.setItem('galleryViewsLast', JSON.stringify(lastViews));
        return views[propertyId];
    } catch { return 0; }
};

// ===== FUNÇÕES DE THUMBNAIL (SIMPLIFICADAS) =====
window.createVideoThumbnail = function(videoUrl, index) {
    return `<div class="gallery-video-item" data-video-url="${videoUrl}" data-index="${index}">
        <div class="video-play-overlay"><i class="fas fa-play"></i></div>
        <video preload="metadata" muted><source src="${videoUrl}"></video>
        <div class="video-badge"><i class="fas fa-video"></i> Vídeo</div>
    </div>`;
};

window.createImageThumbnail = function(imageUrl) {
    return `<img src="${imageUrl}" loading="lazy" class="gallery-thumb" onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">`;
};

// ===== NAVEGAÇÃO NA GALERIA =====
function getCurrentCardIndex(propertyId) {
    const container = document.querySelector(`[data-property-id="${propertyId}"] .property-gallery-container`);
    return container?.dataset.currentIndex ? parseInt(container.dataset.currentIndex) : 0;
}

window.navigatePropertyGallery = function(propertyId, direction) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    const allMedia = property.images?.split(',').filter(url => url?.trim()) || [];
    if (allMedia.length <= 1) return;
    let currentIndex = getCurrentCardIndex(propertyId);
    currentIndex = direction === 'next' ? (currentIndex + 1) % allMedia.length : (currentIndex - 1 + allMedia.length) % allMedia.length;
    updateCardMedia(propertyId, currentIndex);
};

function updateCardMedia(propertyId, newIndex) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    const allMedia = property.images.split(',').filter(url => url.trim());
    if (newIndex < 0 || newIndex >= allMedia.length) return;
    const mediaUrl = allMedia[newIndex];
    const isVideo = window.isVideoUrl(mediaUrl);
    const galleryContainer = document.querySelector(`[data-property-id="${propertyId}"] .property-gallery-container`);
    if (!galleryContainer) return;
    const mainContent = galleryContainer.querySelector('div:first-child');
    if (mainContent) mainContent.outerHTML = isVideo ? window.createVideoThumbnail(mediaUrl, newIndex) : window.createImageThumbnail(mediaUrl);
    galleryContainer.querySelectorAll('.gallery-dot').forEach((dot, idx) => dot.classList.toggle('active', idx === newIndex));
    galleryContainer.dataset.currentIndex = newIndex;
}

// ===== CRIAÇÃO DA GALERIA (SIMPLIFICADA) =====
window.createPropertyGallery = function(property) {
    const allMedia = property.images?.split(',').filter(url => url?.trim()) || [];
    if (!allMedia.length) return '';
    const viewCount = window.getGalleryViews(property.id);
    const firstIsVideo = window.isVideoUrl(allMedia[0]);
    
    const dotsHtml = allMedia.map((url, idx) => `
        <div class="gallery-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" onclick="event.stopPropagation(); updateCardMedia(${property.id}, ${idx})"></div>
    `).join('');
    
    const arrowsHtml = allMedia.length > 1 ? `
        <button class="gallery-nav-arrow gallery-nav-prev" onclick="event.stopPropagation(); navigatePropertyGallery(${property.id}, 'prev')"><i class="fas fa-chevron-left"></i></button>
        <button class="gallery-nav-arrow gallery-nav-next" onclick="event.stopPropagation(); navigatePropertyGallery(${property.id}, 'next')"><i class="fas fa-chevron-right"></i></button>
    ` : '';
    
    return `
        <div class="property-image ${property.rural ? 'rural-image' : ''}" data-property-id="${property.id}">
            <div class="property-gallery-container" onclick="openGalleryAtCurrentIndex(${property.id})" data-current-index="0">
                ${firstIsVideo ? window.createVideoThumbnail(allMedia[0], 0) : window.createImageThumbnail(allMedia[0])}
                ${arrowsHtml}
                <div class="gallery-indicator-mobile"><i class="fas fa-images"></i><span>1/${allMedia.length}</span></div>
                ${allMedia.length > 1 ? `<div class="gallery-controls">${dotsHtml}</div>` : ''}
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGalleryAtCurrentIndex(${property.id})"><i class="fas fa-expand"></i></div>
                <div class="gallery-view-counter"><i class="fas fa-eye"></i><span>${viewCount}</span></div>
            </div>
            ${property.badge ? `<div class="property-badge">${property.badge}</div>` : ''}
            ${property.pdfs && property.pdfs !== 'EMPTY' ? `<button class="pdf-access" onclick="event.stopPropagation(); window.PdfSystem?.showModal(${property.id})"><i class="fas fa-file-pdf"></i></button>` : ''}
        </div>
    `;
};

// ===== MODAL DA GALERIA =====
window.openGalleryAtCurrentIndex = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    const allMedia = property.images?.split(',').filter(url => url?.trim()) || [];
    if (!allMedia.length) return;
    window.registerGalleryView(propertyId);
    window.currentGalleryImages = allMedia;
    window.currentGalleryIndex = getCurrentCardIndex(propertyId);
    
    let modal = document.getElementById('propertyGalleryModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'propertyGalleryModal';
        modal.className = 'gallery-modal';
        modal.innerHTML = `
            <div class="gallery-modal-content">
                <div class="gallery-swipe-area"></div>
                <div id="galleryCurrentMedia"></div>
                <div class="gallery-modal-controls">
                    <button class="gallery-modal-btn" onclick="prevGalleryImage()"><i class="fas fa-chevron-left"></i></button>
                    <div id="galleryCounter" class="gallery-counter">1/1</div>
                    <button class="gallery-modal-btn" onclick="nextGalleryImage()"><i class="fas fa-chevron-right"></i></button>
                </div>
                <button class="gallery-modal-close" onclick="closeGallery()"><i class="fas fa-times"></i></button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => { if (e.target === modal) closeGallery(); });
        document.addEventListener('keydown', (e) => {
            if (modal.style.display !== 'block') return;
            if (e.key === 'ArrowLeft') prevGalleryImage();
            if (e.key === 'ArrowRight') nextGalleryImage();
            if (e.key === 'Escape') closeGallery();
        });
    }
    updateGalleryModalMedia();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

function updateGalleryModalMedia() {
    const container = document.getElementById('galleryCurrentMedia');
    const counter = document.getElementById('galleryCounter');
    if (!container || !window.currentGalleryImages.length) return;
    const url = window.currentGalleryImages[window.currentGalleryIndex];
    const isVideo = window.isVideoUrl(url);
    container.innerHTML = isVideo ? 
        `<video src="${url}" controls autoplay loop class="gallery-modal-video"></video>` :
        `<img src="${url}" class="gallery-modal-image" loading="lazy">`;
    if (counter) counter.textContent = `${window.currentGalleryIndex + 1}/${window.currentGalleryImages.length}`;
}

window.nextGalleryImage = function() {
    if (!window.currentGalleryImages.length) return;
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

window.prevGalleryImage = function() {
    if (!window.currentGalleryImages.length) return;
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

window.closeGallery = function() {
    const modal = document.getElementById('propertyGalleryModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// ===== EVENTOS =====
window.setupGalleryEvents = function() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (document.getElementById('propertyGalleryModal')?.style.display === 'block') updateGalleryModalMedia();
        }, 250);
    });
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.setupGalleryEvents);
else window.setupGalleryEvents();

window.openGallery = window.openGalleryAtCurrentIndex;
console.log('✅ gallery.js carregado (versão otimizada)');
