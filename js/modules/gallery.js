// js/modules/gallery.js - COM SETAS LIQUID GLASS, CONTADOR PERSISTENTE, TIMESTAMPS E FAIXAS DIAGONAIS
// ✅ Funções de visualização delegadas ao SharedCore
// ✅ CORREÇÃO: Acessibilidade - aria-label, alt, aria-hidden (PageSpeed Insights)
// ✅ CORREÇÃO: video-indicator único - gerenciado APENAS por este arquivo
// ✅ NOVO: Faixas diagonais para Destaques Múltiplos (Destaque1 e Destaque2)
console.log('🚀 gallery.js carregado - Versão com Faixas Diagonais');

// ========== VARIÁVEIS GLOBAIS ==========
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;
window.touchStartX = 0;
window.touchEndX = 0;
window.SWIPE_THRESHOLD = 50;

// ========== FUNÇÃO PARA DETECTAR VÍDEO - CENTRALIZADA NO SHAREDCORE =========
// A função window.isVideoUrl é fornecida globalmente pelo SharedCore.js

// ========== FUNÇÕES DELEGADAS PARA O SHAREDCORE (COM FALLBACK) ==========

window.getGalleryViews = function(propertyId) {
    if (window.SharedCore && typeof window.SharedCore.getGalleryViews === 'function') {
        return window.SharedCore.getGalleryViews(propertyId);
    }
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
    try {
        const views = JSON.parse(localStorage.getItem('galleryViews') || '{}');
        let total = 0;
        for (let key in views) {
            if (views.hasOwnProperty(key)) {
                total += views[key];
            }
        }
        return total;
    } catch (error) {
        return 0;
    }
};

window.getLastGalleryView = function(propertyId) {
    if (window.SharedCore && typeof window.SharedCore.getLastGalleryView === 'function') {
        return window.SharedCore.getLastGalleryView(propertyId);
    }
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
        
        return views[propertyId];
    } catch (error) {
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
             aria-label="Vídeo do imóvel - miniatura"
             style="position:relative; cursor:pointer; width:100%; height:100%;">
            <div style="position:relative; width:100%; height:100%; background:#1a1a2e;">
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); 
                            background:rgba(0,0,0,0.7); border-radius:50%; width:50px; height:50px;
                            display:flex; align-items:center; justify-content:center; z-index:10;">
                    <i class="fas fa-play" style="color:white; font-size:24px; margin-left:4px;" aria-hidden="true"></i>
                </div>
                <video style="width:100%; height:100%; object-fit:cover; filter:brightness(0.7);" 
                       preload="metadata" muted
                       aria-label="Vídeo do imóvel">
                    <source src="${videoUrl}" type="video/mp4">
                    <source src="${videoUrl}" type="video/quicktime">
                </video>
            </div>
        </div>
    `;
};

// ========== FUNÇÃO PARA CRIAR MINIATURA DE IMAGEM (COM LAZY LOADING E ALT) ==========
window.createImageThumbnail = function(imageUrl, index, propertyTitle = 'Imóvel') {
    const safeTitle = propertyTitle || 'Imóvel';
    return `
        <div class="gallery-image-item" data-index="${index}" style="width:100%; height:100%;">
            <img src="${imageUrl}" 
                 loading="lazy"
                 alt="${safeTitle} - imagem ${index + 1} da galeria"
                 style="width:100%; height:100%; object-fit:cover;"
                 onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
        </div>
    `;
};

// ========== GERAR FAIXAS DIAGONAIS (ESTILO GOLD RIBBON - VERSÃO FINAL) ==========
function generateDiagonalBadges(property) {
    var badges = [];
    var colors = {
        'Luxo': { bg: '#d4a017', color: '#1a1a2e', border: '#f5d76e' },
        'Novo': { bg: '#27ae60', color: '#ffffff', border: '#2ecc71' },
        'Destaque': { bg: '#2980b9', color: '#ffffff', border: '#3498db' },
        'Lançamento': { bg: '#e74c3c', color: '#ffffff', border: '#f1948a' },
        'Oportunidade': { bg: '#f39c12', color: '#1a1a2e', border: '#f7dc6f' },
        'Exclusivo': { bg: '#8e44ad', color: '#ffffff', border: '#af7ac5' },
        'Imperdível': { bg: '#e67e22', color: '#ffffff', border: '#f0b27a' },
        'Última Unidade': { bg: '#c0392b', color: '#ffffff', border: '#e74c3c' },
        'Beira Mar': { bg: '#1abc9c', color: '#ffffff', border: '#48c9b0' },
        'Vista Mar': { bg: '#3498db', color: '#ffffff', border: '#5dade2' },
        'Com Lazer': { bg: '#2ecc71', color: '#1a1a2e', border: '#58d68d' },
        'Pronto para Morar': { bg: '#9b59b6', color: '#ffffff', border: '#af7ac5' },
        'Alto Padrão': { bg: '#d4a017', color: '#1a1a2e', border: '#f5d76e' }
    };

    // Badge principal (DESTAQUE)
    if (property.badge && property.badge !== 'Nenhum') {
        var color = colors[property.badge] || { bg: '#2c3e50', color: '#ffffff', border: '#5d6d7e' };
        badges.push({
            text: property.badge,
            bg: color.bg,
            color: color.color,
            border: color.border || color.bg,
            position: 0,
            size: 'large'
        });
    }

    // Badge 1 (DESTAQUE1)
    if (property.badge1 && property.badge1 !== 'Nenhum') {
        var color1 = colors[property.badge1] || { bg: '#34495e', color: '#ffffff', border: '#5d6d7e' };
        badges.push({
            text: property.badge1,
            bg: color1.bg,
            color: color1.color,
            border: color1.border || color1.bg,
            position: 1,
            size: 'medium'
        });
    }

    // Badge 2 (DESTAQUE2) - 🔴 CORRIGIDO: Mesmo lado das demais
    if (property.badge2 && property.badge2 !== 'Nenhum') {
        var color2 = colors[property.badge2] || { bg: '#2c3e50', color: '#ffffff', border: '#5d6d7e' };
        badges.push({
            text: property.badge2,
            bg: color2.bg,
            color: color2.color,
            border: color2.border || color2.bg,
            position: 2,
            size: 'small'
            // 🔴 REMOVIDO: alignRight: true
        });
    }

    return badges;
}

// ========== RENDERIZAR FAIXAS DIAGONAIS (ESTILO GOLD RIBBON - VERSÃO FINAL) ==========
function renderDiagonalBadges(property) {
    var badges = generateDiagonalBadges(property);
    if (badges.length === 0) return '';

    // 🔴 FAIXA NO TOPO (mais alta possível)
    var baseTop = 10;      // Reduzido para ficar bem no topo
    var spacing = 52;

    var result = '';

    for (var i = 0; i < badges.length; i++) {
        var badge = badges[i];
        var top = baseTop + (i * spacing);
        var isFirst = i === 0;

        var fontSize, padding, width, leftOffset, letterSpacing;

        if (isFirst) {
            fontSize = '0.85rem';
            padding = '8px 45px 8px 45px';  // Padding equilibrado
            width = '280px';
            leftOffset = '-40px';
            letterSpacing = '3px';
        } else if (badge.size === 'medium') {
            fontSize = '0.75rem';
            padding = '6px 38px';
            width = '190px';
            leftOffset = '-35px';
            letterSpacing = '2px';
        } else {
            fontSize = '0.65rem';
            padding = '5px 30px';
            width = '180px';
            leftOffset = '-30px';
            letterSpacing = '1.5px';
        }

        var positionStyle = 'left: ' + leftOffset + ';';
        var rotateAngle = '-42deg';  // Mantém a diagonal
        var textAlign = 'center';
        var opacity = 0.92 - (i * 0.04);

        var gradientBg = 'background: linear-gradient(135deg, ' + badge.bg + ', ' + badge.border + ');';
        var borderBottom = 'border-bottom: 2px solid ' + badge.border + ';';
        var shadowStyle = 'box-shadow: 0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15);';
        
        var html = '';
        html += '<div class="diagonal-badge ' + badge.size + '"';
        html += ' style="';
        html += 'position: absolute;';
        html += 'top: ' + top + 'px;';
        html += positionStyle;
        html += 'transform: rotate(' + rotateAngle + ');';
        html += gradientBg;
        html += 'color: ' + badge.color + ';';
        html += 'padding: ' + padding + ';';
        html += 'font-size: ' + fontSize + ';';
        html += 'font-weight: ' + (isFirst ? '800' : '600') + ';';
        html += 'text-transform: uppercase;';
        html += 'letter-spacing: ' + letterSpacing + ';';
        html += 'text-align: center;';
        html += 'width: ' + width + ';';
        html += 'white-space: nowrap;';
        html += 'opacity: ' + opacity + ';';
        html += 'z-index: ' + (10 - i) + ';';
        html += 'font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;';
        html += 'pointer-events: none;';
        html += 'text-shadow: 0 1px 2px rgba(0,0,0,0.3);';
        html += 'border-radius: 3px;';
        html += borderBottom;
        html += shadowStyle;
        // 🔴 NOVO: Flexbox para centralização perfeita
        html += 'display: flex;';
        html += 'align-items: center;';
        html += 'justify-content: center;';
        html += 'box-sizing: border-box;';
        html += '">';
        // 🔴 NOVO: Span com o texto centralizado
        html += '<span style="display: inline-block; text-align: center; width: 100%;">' + badge.text + '</span>';
        // Detalhe decorativo da ponta
        html += '<span style="position: absolute; right: -12px; top: 0; width: 0; height: 0; border-top: 12px solid transparent; border-bottom: 12px solid transparent; border-left: 12px solid ' + badge.bg + '; opacity: 0.5;"></span>';
        html += '</div>';

        result += html;
    }

    return result;
}

// ========== FUNÇÃO PARA GERAR SETAS LIQUID GLASS ==========
function createNavigationArrows(propertyId, totalItems, currentIndex) {
    if (totalItems <= 1) return '';
    
    return `
        <button class="gallery-nav-arrow gallery-nav-prev" 
                aria-label="Imagem anterior"
                onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${propertyId}, 'prev')"
                style="position:absolute; left:10px; top:50%; transform:translateY(-50%); 
                       width:40px; height:40px; border-radius:50%; 
                       background:rgba(255,255,255,0.2); 
                       backdrop-filter:blur(8px);
                       border:1px solid rgba(255,255,255,0.3);
                       color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                       font-size:18px; transition:all 0.3s ease; z-index:25;
                       box-shadow:0 2px 10px rgba(0,0,0,0.2);">
            <i class="fas fa-chevron-left" aria-hidden="true"></i>
        </button>
        <button class="gallery-nav-arrow gallery-nav-next" 
                aria-label="Próxima imagem"
                onclick="event.stopPropagation(); event.preventDefault(); navigatePropertyGallery(${propertyId}, 'next')"
                style="position:absolute; right:10px; top:50%; transform:translateY(-50%); 
                       width:40px; height:40px; border-radius:50%; 
                       background:rgba(255,255,255,0.2); 
                       backdrop-filter:blur(8px);
                       border:1px solid rgba(255,255,255,0.3);
                       color:white; cursor:pointer; display:flex; align-items:center; justify-content:center;
                       font-size:18px; transition:all 0.3s ease; z-index:25;
                       box-shadow:0 2px 10px rgba(0,0,0,0.2);">
            <i class="fas fa-chevron-right" aria-hidden="true"></i>
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
            const propertyTitle = property.title || 'Imóvel';
            mainContent.outerHTML = window.createImageThumbnail(mediaUrl, newIndex, propertyTitle);
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

// ========== FUNÇÃO PRINCIPAL: Criar galeria (COM FAIXAS DIAGONAIS) ==========
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
    const propertyTitle = property.title || 'Imóvel';
    
    // 🔴 NOVO: Gerar faixas diagonais
    const badgesHtml = renderDiagonalBadges(property);
    
    const dotsHtml = allMediaUrls.map((url, idx) => {
        const isVideo = window.isVideoUrl(url);
        const icon = isVideo ? '<i class="fas fa-video" style="font-size:0.6rem;" aria-hidden="true"></i>' : '';
        return `
            <div class="gallery-dot ${idx === 0 ? 'active' : ''}" 
                 data-index="${idx}"
                 role="button"
                 aria-label="Ir para imagem ${idx + 1} de ${totalMediaCount}"
                 onclick="event.stopPropagation(); event.preventDefault(); updateCardMedia(${property.id}, ${idx})"
                 style="${isVideo ? 'background:#9b59b6;' : ''}">
                ${icon}
            </div>
        `;
    }).join('');
    
    const arrowsHtml = totalMediaCount > 1 ? createNavigationArrows(property.id, totalMediaCount, currentIndex) : '';
    
    const viewCounterHtml = `
    <div class="gallery-view-counter" aria-label="${viewCount} visualizações">
        <i class="fas fa-eye" aria-hidden="true"></i>
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
                    window.createImageThumbnail(firstMediaUrl, 0, propertyTitle)
                }
                
                ${arrowsHtml}
                
                ${badgesHtml}
                
                <div class="gallery-indicator-mobile" aria-label="Indicador de imagens">
                    <i class="fas fa-images" aria-hidden="true"></i>
                    <span>1/${totalMediaCount}</span>
                </div>
                
                ${totalMediaCount > 1 ? `
                    <div class="gallery-controls" style="display:flex; justify-content:center; gap:6px; margin-top:5px;">
                        ${dotsHtml}
                    </div>
                ` : ''}
                
                <div class="gallery-expand-icon" 
                     role="button"
                     aria-label="Expandir galeria"
                     onclick="event.stopPropagation(); openGalleryAtCurrentIndex(${property.id})">
                    <i class="fas fa-expand" aria-hidden="true"></i>
                </div>
                
                ${viewCounterHtml}
            </div>
            
            ${hasVideos ? `<div class="video-indicator" style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:4px 8px; border-radius:4px; font-size:0.7rem; z-index:20;">
                <i class="fas fa-video" aria-hidden="true"></i> Vídeo
            </div>` : ''}
            
            ${hasImages && property.pdfs && property.pdfs !== 'EMPTY' ? 
                `<button class="pdf-access" 
                        aria-label="Documentos PDF do imóvel"
                        onclick="event.stopPropagation(); event.preventDefault(); window.PdfSystem.showModal(${property.id});"
                        style="position: absolute; bottom: 2px; right: 35px; background: rgba(255,255,255,0.95); border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; color: #1a5276; transition: all 0.3s ease; z-index: 15; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1px solid rgba(0,0,0,0.15);"
                    title="Documentos do imóvel (senha: doc123)">
                    <i class="fas fa-file-pdf" aria-hidden="true"></i>
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
        galleryModal.setAttribute('role', 'dialog');
        galleryModal.setAttribute('aria-modal', 'true');
        galleryModal.setAttribute('aria-label', 'Galeria de imagens');
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
                    <button class="gallery-modal-btn" 
                            aria-label="Imagem anterior"
                            onclick="prevGalleryImage()" 
                            style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-left" aria-hidden="true"></i>
                    </button>
                    <div id="galleryCounter" class="gallery-counter" 
                         aria-label="Imagem ${currentIndex + 1} de ${window.currentGalleryImages.length}"
                         style="background:rgba(0,0,0,0.7); color:white; padding:12px 20px; border-radius:25px; font-size:16px;">${currentIndex + 1} / ${window.currentGalleryImages.length}</div>
                    <button class="gallery-modal-btn" 
                            aria-label="Próxima imagem"
                            onclick="nextGalleryImage()" 
                            style="background:rgba(0,0,0,0.7); color:white; border:none; width:50px; height:50px; border-radius:50%; cursor:pointer; font-size:24px;">
                        <i class="fas fa-chevron-right" aria-hidden="true"></i>
                    </button>
                </div>
                
                <button class="gallery-modal-close" 
                        aria-label="Fechar galeria"
                        onclick="closeGallery()" 
                        style="position:fixed; top:20px; right:20px; background:rgba(0,0,0,0.7); color:white; border:none; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size:20px; z-index:200001;">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        `;
        document.body.appendChild(galleryModal);
    } else {
        const counterElement = document.getElementById('galleryCounter');
        if (counterElement) {
            counterElement.textContent = `${currentIndex + 1} / ${window.currentGalleryImages.length}`;
            counterElement.setAttribute('aria-label', `Imagem ${currentIndex + 1} de ${window.currentGalleryImages.length}`);
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
                       controlslist="nodownload"
                       aria-label="Vídeo do imóvel">
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
                     alt="Imagem ${window.currentGalleryIndex + 1} da galeria"
                     style="width:100%; height:100%; object-fit:contain;"
                     onerror="this.src='https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80'">
            </div>
        `;
    }
    
    if (counterElement) {
        counterElement.textContent = `${window.currentGalleryIndex + 1} / ${window.currentGalleryImages.length}`;
        counterElement.setAttribute('aria-label', `Imagem ${window.currentGalleryIndex + 1} de ${window.currentGalleryImages.length}`);
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

        /* ========== FAIXAS DIAGONAIS ========== */
        .diagonal-badge {
            position: absolute;
            pointer-events: none;
            z-index: 10;
            overflow: hidden;
            text-overflow: ellipsis;
            box-sizing: border-box;
            transition: all 0.3s ease;
        }

        .diagonal-badge.large {
            font-size: 1.1rem;
            padding: 8px 40px;
            font-weight: 900;
            letter-spacing: 3px;
            width: 220px;
        }

        .diagonal-badge.medium {
            font-size: 0.85rem;
            padding: 6px 30px;
            font-weight: 700;
            letter-spacing: 2px;
            width: 200px;
        }

        .diagonal-badge.small {
            font-size: 0.7rem;
            padding: 5px 25px;
            font-weight: 600;
            letter-spacing: 1.5px;
            width: 180px;
        }

        .diagonal-badge::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .diagonal-badge.large {
                font-size: 0.9rem;
                padding: 6px 25px;
                width: 160px;
                left: -25px;
            }
            .diagonal-badge.medium {
                font-size: 0.7rem;
                padding: 4px 20px;
                width: 140px;
                left: -20px;
            }
            .diagonal-badge.small {
                font-size: 0.6rem;
                padding: 3px 15px;
                width: 120px;
                left: -15px;
            }
        }

        .diagonal-badge:hover {
            transform: rotate(-40deg) scale(1.05);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
        }
    `;
    document.head.appendChild(style);
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.setupGalleryEvents);
} else {
    window.setupGalleryEvents();
}

// ========= EXPOSIÇÃO DA FUNÇÃO openGallery COMO ALIAS =========
window.openGallery = window.openGalleryAtCurrentIndex;
