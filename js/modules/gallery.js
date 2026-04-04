// js/modules/gallery.js - Sistema de galeria de fotos (CORE) - COM LOOP DE VÍDEO
console.log('🚀 gallery.js carregado - Versão com loop de vídeo');

// ========== VARIÁVEIS GLOBAIS ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.currentVideoPlayer = null;  // Referência ao player de vídeo atual
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

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
window.createVideoThumbnail = function(videoUrl, index) {
    return `
        <div class="gallery-video-item" 
             data-video-url="${videoUrl}"
             onclick="openVideo('${videoUrl}')"
             style="position:relative; cursor:pointer;">
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

// ========== FUNÇÃO PARA ABRIR VÍDEO EM LOOP ==========
window.openVideo = function(videoUrl) {
    if (videoUrl) {
        // Criar modal específico para vídeo com loop
        showVideoModal(videoUrl);
    }
};

// ========== MODAL DE VÍDEO COM LOOP E CONTROLES ==========
function showVideoModal(videoUrl) {
    // Verificar se já existe um modal de vídeo
    let videoModal = document.getElementById('videoLoopModal');
    
    if (!videoModal) {
        videoModal = document.createElement('div');
        videoModal.id = 'videoLoopModal';
        videoModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            z-index: 200000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        videoModal.innerHTML = `
            <div style="position:relative; max-width:90%; max-height:90%; background:#000; border-radius:12px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.5);">
                <video id="loopVideo" 
                       style="width:100%; max-height:80vh; display:block;"
                       autoplay
                       loop
                       controls
                       controlslist="nodownload">
                    <source src="" type="video/mp4">
                    <source src="" type="video/quicktime">
                    Seu navegador não suporta vídeo.
                </video>
                <div style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem;">
                    <i class="fas fa-sync-alt"></i> Modo loop ativado
                </div>
                <button id="closeVideoModal" 
                        style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; border:none; width:40px; height:40px; border-radius:50%; cursor:pointer; font-size:20px; display:flex; align-items:center; justify-content:center; transition:all 0.3s;">
                    <i class="fas fa-times"></i>
                </button>
                <div style="position:absolute; bottom:10px; right:10px; display:flex; gap:8px;">
                    <button id="pauseVideoBtn" 
                            style="background:rgba(0,0,0,0.7); color:white; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; transition:all 0.3s;">
                        <i class="fas fa-pause"></i>
                    </button>
                    <button id="playVideoBtn" 
                            style="background:rgba(0,0,0,0.7); color:white; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; transition:all 0.3s;">
                        <i class="fas fa-play"></i>
                    </button>
                    <button id="stopVideoBtn" 
                            style="background:rgba(0,0,0,0.7); color:white; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; transition:all 0.3s;">
                        <i class="fas fa-stop"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(videoModal);
        
        // Eventos dos botões
        const closeBtn = document.getElementById('closeVideoModal');
        const pauseBtn = document.getElementById('pauseVideoBtn');
        const playBtn = document.getElementById('playVideoBtn');
        const stopBtn = document.getElementById('stopVideoBtn');
        const video = document.getElementById('loopVideo');
        
        if (closeBtn) {
            closeBtn.onclick = function() {
                if (video) {
                    video.pause();
                    video.src = '';
                }
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            };
        }
        
        if (pauseBtn && video) {
            pauseBtn.onclick = function() {
                video.pause();
            };
        }
        
        if (playBtn && video) {
            playBtn.onclick = function() {
                video.play();
            };
        }
        
        if (stopBtn && video) {
            stopBtn.onclick = function() {
                video.pause();
                video.currentTime = 0;
            };
        }
        
        // Fechar ao clicar fora
        videoModal.onclick = function(e) {
            if (e.target === videoModal) {
                if (video) {
                    video.pause();
                    video.src = '';
                }
                videoModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
        
        // Prevenir que o clique no vídeo feche o modal
        const videoContainer = videoModal.querySelector('div[style*="position:relative"]');
        if (videoContainer) {
            videoContainer.onclick = function(e) {
                e.stopPropagation();
            };
        }
    }
    
    // Configurar e abrir o vídeo
    const video = document.getElementById('loopVideo');
    if (video) {
        // Parar vídeo anterior se existir
        video.pause();
        video.src = '';
        
        // Carregar novo vídeo
        const source = video.querySelector('source');
        if (source) {
            source.src = videoUrl;
        }
        video.load();
        
        // Garantir loop ativado
        video.loop = true;
        
        // Tentar reproduzir automaticamente
        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.log('⚠️ Autoplay bloqueado pelo navegador:', error);
                // Mostrar mensagem para o usuário clicar
                const playBtn = document.getElementById('playVideoBtn');
                if (playBtn) {
                    playBtn.style.animation = 'pulse 1s infinite';
                }
            });
        }
    }
    
    videoModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// ========== FUNÇÃO PRINCIPAL: Criar galeria no card do imóvel ==========
window.createPropertyGallery = function(property) {
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    const allMediaUrls = hasImages ? property.images.split(',').filter(url => url.trim() !== '') : [];
    
    // Separar imagens e vídeos (ambos serão exibidos!)
    const imageUrls = allMediaUrls.filter(url => !window.isVideoUrl(url));
    const videoUrls = allMediaUrls.filter(url => window.isVideoUrl(url));
    
    // COMBINAR: Imagens primeiro, depois vídeos (ou manter ordem original)
    const allDisplayMedia = [...imageUrls, ...videoUrls];
    const totalMediaCount = allDisplayMedia.length;
    const hasVideos = videoUrls.length > 0;
    
    const firstMediaUrl = allDisplayMedia.length > 0 ? allDisplayMedia[0] : 
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80';
    
    // Verificar se o primeiro item é vídeo
    const firstIsVideo = window.isVideoUrl(firstMediaUrl);
    
    // Se for vídeo, mostrar thumbnail especial
    if (firstIsVideo && allDisplayMedia.length === 1) {
        // Apenas vídeo, sem imagens
        return `
            <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
                <div class="property-gallery-container" onclick="openVideo('${firstMediaUrl}')" style="cursor:pointer;">
                    ${window.createVideoThumbnail(firstMediaUrl, 0)}
                </div>
                
                ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
                
                <div class="video-indicator" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; z-index:20;">
                    <i class="fas fa-video"></i> Tem vídeo
                </div>
                
                ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                    `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id})"
                            style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                            title="Documentos do imóvel (senha: doc123)">
                        <i class="fas fa-file-pdf"></i>
                    </button>` : ''}
                
                <div class="media-count" style="position:absolute; bottom:5px; left:5px; background:rgba(0,0,0,0.6); color:white; padding:2px 6px; border-radius:3px; font-size:0.7rem;">
                    <i class="fas fa-video"></i> ${totalMediaCount}
                </div>
            </div>`;
    }
    
    // Caso normal: imagens + vídeos (múltiplos itens)
    return `
        <div class="property-image ${property.rural ? 'rural-image' : ''}" style="position: relative; height: 250px;">
            <div class="property-gallery-container" onclick="openGallery(${property.id})">
                ${firstIsVideo ? 
                    window.createVideoThumbnail(firstMediaUrl, 0) :
                    `<img src="${firstMediaUrl}" class="property-gallery-image" alt="${property.title}"
                         onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">`
                }
                
                <div class="gallery-indicator-mobile"><i class="fas fa-${hasVideos ? 'video' : 'images'}"></i><span>${totalMediaCount}</span></div>
                
                <div class="gallery-controls">
                    ${allDisplayMedia.map((_, idx) => `
                        <div class="gallery-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}"
                             onclick="event.stopPropagation(); event.preventDefault(); showGalleryMedia(${property.id}, ${idx})"></div>
                    `).join('')}
                </div>
                
                <div class="gallery-expand-icon" onclick="event.stopPropagation(); openGallery(${property.id})">
                    <i class="fas fa-expand"></i>
                </div>
            </div>
            
            ${property.badge ? `<div class="property-badge ${property.rural ? 'rural-badge' : ''}">${property.badge}</div>` : ''}
            
            ${hasVideos ? `<div class="video-indicator" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; z-index:20;">
                <i class="fas fa-video"></i> Tem vídeo
            </div>` : ''}
            
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access" onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                    style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf"></i>
                </button>` : ''}
        </div>`;
};

// ========== ABRIR GALERIA (MOSTRANDO IMAGENS E VÍDEOS) ==========
window.openGallery = function(propertyId) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    
    // Manter TODOS os arquivos (imagens E vídeos) para navegação
    window.currentGalleryImages = allMedia;
    window.currentGalleryIndex = 0;
    
    let galleryModal = document.getElementById('propertyGalleryModal');
    
    if (!galleryModal) {
        galleryModal = document.createElement('div');
        galleryModal.id = 'propertyGalleryModal';
        galleryModal.className = 'gallery-modal';
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
                    <!-- Conteúdo será inserido dinamicamente -->
                </div>
                
                <div style="position:fixed; bottom:20px; left:0; right:0; display:flex; justify-content:center; gap:20px; z-index:200001;">
                    <button class="gallery-modal-btn" onclick="prevGalleryImage()" style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div id="galleryCounter" class="gallery-counter" style="background:rgba(0,0,0,0.7); color:white; padding:12px 20px; border-radius:25px; font-size:16px;">1 / ${window.currentGalleryImages.length}</div>
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
    }
    
    updateGalleryModalMedia();
    galleryModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
};

// ========== ATUALIZAR MODAL COM MÍDIA CORRETA ==========
function updateGalleryModalMedia() {
    const container = document.getElementById('galleryCurrentMedia');
    const counterElement = document.getElementById('galleryCounter');
    
    if (!container || !window.currentGalleryImages.length) return;
    
    const currentUrl = window.currentGalleryImages[window.currentGalleryIndex];
    const isVideo = window.isVideoUrl(currentUrl);
    
    if (isVideo) {
        // Vídeo: mostrar player com loop e controles
        container.innerHTML = `
            <div style="position:relative; width:90%; max-width:900px; background:#000; border-radius:12px; overflow:hidden;">
                <video id="galleryVideo" 
                       style="width:100%; max-height:80vh; display:block;"
                       autoplay
                       loop
                       controls
                       controlslist="nodownload">
                    <source src="${currentUrl}" type="video/mp4">
                    <source src="${currentUrl}" type="video/quicktime">
                    Seu navegador não suporta vídeo.
                </video>
                <div style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.6); color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem;">
                    <i class="fas fa-sync-alt"></i> Repetindo automaticamente
                </div>
            </div>
        `;
        
        // Garantir que o vídeo tenha loop ativado e tente tocar
        const video = document.getElementById('galleryVideo');
        if (video) {
            video.loop = true;
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('⚠️ Autoplay bloqueado:', error);
                });
            }
        }
    } else {
        // Imagem: mostrar imagem
        container.innerHTML = `
            <img src="${currentUrl}" class="gallery-modal-image" 
                 alt="Imagem ${window.currentGalleryIndex + 1}"
                 style="max-width:90%; max-height:80vh; object-fit:contain;"
                 onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
        `;
    }
    
    if (counterElement) {
        counterElement.textContent = `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
    }
}

// ========== MOSTRAR MÍDIA ESPECÍFICA NO CARD ==========
window.showGalleryMedia = function(propertyId, index) {
    const property = window.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    const hasImages = property.images && property.images.length > 0 && property.images !== 'EMPTY';
    if (!hasImages) return;
    
    const allMedia = property.images.split(',').filter(url => url.trim() !== '');
    if (index < 0 || index >= allMedia.length) return;
    
    const mediaUrl = allMedia[index];
    const isVideo = window.isVideoUrl(mediaUrl);
    
    const container = document.querySelector(`[onclick="openGallery(${propertyId})"]`);
    if (container) {
        const img = container.querySelector('.property-gallery-image');
        const videoContainer = container.querySelector('.gallery-video-item');
        
        if (isVideo && videoContainer) {
            // Atualizar o data-video-url
            videoContainer.setAttribute('data-video-url', mediaUrl);
            videoContainer.setAttribute('onclick', `openVideo('${mediaUrl}')`);
        } else if (!isVideo && img) {
            img.src = mediaUrl;
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

// ========== NAVEGAÇÃO ==========
window.nextGalleryImage = function() {
    // Parar vídeo atual se existir
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) {
        currentVideo.pause();
    }
    
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

window.prevGalleryImage = function() {
    // Parar vídeo atual se existir
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) {
        currentVideo.pause();
    }
    
    if (window.currentGalleryImages.length === 0) return;
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    updateGalleryModalMedia();
};

// ========== FECHAR GALERIA ==========
window.closeGallery = function() {
    // Parar vídeo se estiver tocando
    const currentVideo = document.getElementById('galleryVideo');
    if (currentVideo) {
        currentVideo.pause();
        currentVideo.src = '';
    }
    
    const galleryModal = document.getElementById('propertyGalleryModal');
    if (galleryModal) {
        galleryModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        window.currentGalleryImages = [];
        window.currentGalleryIndex = 0;
    }
    
    // Também fechar modal de vídeo se estiver aberto
    const videoModal = document.getElementById('videoLoopModal');
    if (videoModal && videoModal.style.display === 'flex') {
        const video = document.getElementById('loopVideo');
        if (video) {
            video.pause();
            video.src = '';
        }
        videoModal.style.display = 'none';
    }
};

// ========== TOUCH/SWIPE ==========
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
};

// Adicionar CSS para animação do botão
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); background: rgba(0,0,0,0.7); }
        50% { transform: scale(1.1); background: rgba(255,0,0,0.8); }
        100% { transform: scale(1); background: rgba(0,0,0,0.7); }
    }
`;
document.head.appendChild(style);

console.log('✅ gallery.js carregado - Vídeos em LOOP automático!');
