/**
 * @fileoverview Generador de paletas de colores a partir de imágenes
 * @version 1.0.0
 * @author 686f6c61
 * @license MIT
 */

/**
 * Clase principal para la generación y gestión de paletas de colores
 * @class ColorPaletteGenerator
 */
class ColorPaletteGenerator {
    /**
     * Inicializa el generador de paletas
     * @constructor
     */
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
        this.currentPalette = [];
    }

    /**
     * Configura los event listeners para el manejo de archivos
     * @private
     */
    setupEventListeners() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('is-primary');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('is-primary');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('is-primary');
            const file = e.dataTransfer.files[0];
            this.processImage(file);
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            this.processImage(file);
        });
    }

    /**
     * Procesa la imagen subida y genera la paleta de colores
     * @param {File} file - Archivo de imagen a procesar
     */
    processImage(file) {
        if (!file.type.startsWith('image/')) {
            alert('Por favor, sube un archivo de imagen');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                this.ctx.drawImage(img, 0, 0);
                const colors = this.extractColors();
                this.displayPalette(colors);
            };
            img.src = e.target.result;
            document.getElementById('previewImage').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    /**
     * Convierte valores RGB a HSL
     * @param {number} r - Valor rojo (0-255)
     * @param {number} g - Valor verde (0-255)
     * @param {number} b - Valor azul (0-255)
     * @returns {Array<number>} Array con valores [h, s, l]
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [
            Math.round(h * 360),
            Math.round(s * 100),
            Math.round(l * 100)
        ];
    }

    /**
     * Convierte valores HSL a RGB
     * @param {number} h - Matiz (0-360)
     * @param {number} s - Saturación (0-100)
     * @param {number} l - Luminosidad (0-100)
     * @returns {Array<number>} Array con valores [r, g, b]
     */
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }

    /**
     * Genera el color complementario de un color dado
     * @param {string} color - Color en formato RGB
     * @returns {string} Color complementario en formato RGB
     */
    getComplementaryColor(color) {
        const [r, g, b] = this.parseRgb(color);
        const [h, s, l] = this.rgbToHsl(r, g, b);
        
        // Calculate complementary hue (180 degrees opposite)
        const complementaryHue = (h + 180) % 360;
        
        // Convert back to RGB
        const [cr, cg, cb] = this.hslToRgb(complementaryHue, s, l);
        return `rgb(${cr}, ${cg}, ${cb})`;
    }

    /**
     * Genera una paleta de colores complementarios
     * @returns {Array<Object>} Array de objetos con color y porcentaje
     */
    generateComplementaryPalette() {
        if (!this.currentPalette.length) {
            this.showNotification('No base palette to generate complements', 'is-danger');
            return [];
        }

        const complementaryPalette = [];
        
        this.currentPalette.forEach(({ color, percentage }) => {
            const [r, g, b] = this.parseRgb(color);
            const [h, s, l] = this.rgbToHsl(r, g, b);
            
            // Calculate complementary hue and variations
            const complementaryHue = (h + 180) % 360;
            const analogousPlus = (complementaryHue + 30) % 360;
            const analogousMinus = (complementaryHue - 30 + 360) % 360;

            // Add original color
            complementaryPalette.push({ color, percentage });

            // Add complementary color with variations
            const variations = [
                { h: complementaryHue, p: percentage },
                { h: analogousPlus, p: Math.round(percentage * 0.7) },
                { h: analogousMinus, p: Math.round(percentage * 0.7) }
            ];

            variations.forEach(({ h, p }) => {
                const [cr, cg, cb] = this.hslToRgb(h, s, l);
                complementaryPalette.push({
                    color: `rgb(${cr}, ${cg}, ${cb})`,
                    percentage: p
                });
            });
        });

        return complementaryPalette;
    }

    /**
     * Muestra la paleta de colores complementarios en la interfaz
     */
    displayComplementaryPalette() {
        const complementaryPalette = this.generateComplementaryPalette();
        if (!complementaryPalette.length) return;

        const paletteContainer = document.getElementById('colorPalette');
        
        // Cambiar el texto a español
        const complementarySection = document.createElement('div');
        complementarySection.className = 'box mt-4';
        complementarySection.innerHTML = `
            <h3 class="title is-5">Paleta complementaria</h3>
            <div class="columns is-multiline" id="complementaryColors"></div>
        `;
        
        const complementaryContainer = complementarySection.querySelector('#complementaryColors');
        
        complementaryPalette.forEach(({ color, percentage }) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'column is-2 color-box';
            colorBox.style.backgroundColor = color;
            
            const colorInfo = document.createElement('div');
            colorInfo.className = 'color-code';
            
            const [r, g, b] = this.parseRgb(color);
            const [h, s, l] = this.rgbToHsl(r, g, b);
            
            const rgbFormat = `rgb(${r}, ${g}, ${b})`;
            const hslFormat = `hsl(${h}, ${s}%, ${l}%)`;
            
            colorInfo.dataset.rgb = `${rgbFormat}\n${percentage}%`;
            colorInfo.dataset.hsl = `${hslFormat}\n${percentage}%`;
            colorInfo.dataset.currentFormat = 'rgb';
            colorInfo.textContent = colorInfo.dataset.rgb;
            
            colorInfo.addEventListener('click', (e) => {
                e.stopPropagation();
                const format = colorInfo.dataset.currentFormat;
                if (format === 'rgb') {
                    colorInfo.textContent = colorInfo.dataset.hsl;
                    colorInfo.dataset.currentFormat = 'hsl';
                    colorInfo.classList.add('format-hsl');
                } else {
                    colorInfo.textContent = colorInfo.dataset.rgb;
                    colorInfo.dataset.currentFormat = 'rgb';
                    colorInfo.classList.remove('format-hsl');
                }
            });
            
            colorBox.addEventListener('click', () => this.copyToClipboard(color));
            colorBox.appendChild(colorInfo);
            complementaryContainer.appendChild(colorBox);
        });

        // Add to main palette container
        paletteContainer.appendChild(complementarySection);
    }

    /**
     * Parsea un string RGB a array de valores numéricos
     * @param {string} rgb - Color en formato "rgb(r, g, b)"
     * @returns {Array<number>|null} Array con valores [r, g, b] o null si es inválido
     */
    parseRgb(rgb) {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
        }
        return null;
    }

    /**
     * Calcula la distancia entre dos colores
     * @param {string} color1 - Primer color en formato RGB
     * @param {string} color2 - Segundo color en formato RGB
     * @returns {number} Distancia entre los colores
     */
    colorDistance(color1, color2) {
        const [r1, g1, b1] = this.parseRgb(color1);
        const [r2, g2, b2] = this.parseRgb(color2);
        const [h1, s1, l1] = this.rgbToHsl(r1, g1, b1);
        const [h2, s2, l2] = this.rgbToHsl(r2, g2, b2);

        // RGB distance
        const rgbDistance = Math.sqrt(
            Math.pow(r1 - r2, 2) + 
            Math.pow(g1 - g2, 2) + 
            Math.pow(b1 - b2, 2)
        );

        // HSL distance (considering hue wrapping)
        const hueDiff = Math.min(Math.abs(h1 - h2), 360 - Math.abs(h1 - h2));
        const hslDistance = Math.sqrt(
            Math.pow(hueDiff / 360 * 100, 2) + 
            Math.pow(s1 - s2, 2) + 
            Math.pow(l1 - l2, 2)
        );

        // Combined distance (weighted average)
        return (rgbDistance + hslDistance * 2) / 3;
    }

    /**
     * Encuentra el centroide de un cluster de colores
     * @param {Array<string>} cluster - Array de colores RGB
     * @returns {string|null} Color centroide en formato RGB o null si el cluster está vacío
     */
    findCentroid(cluster) {
        if (cluster.length === 0) return null;
        
        const sum = cluster.reduce((acc, color) => {
            const [r, g, b] = this.parseRgb(color);
            acc.r += r;
            acc.g += g;
            acc.b += b;
            return acc;
        }, { r: 0, g: 0, b: 0 });

        return `rgb(${Math.round(sum.r / cluster.length)}, ${Math.round(sum.g / cluster.length)}, ${Math.round(sum.b / cluster.length)})`;
    }

    /**
     * Extrae los colores dominantes de la imagen
     * @returns {Array<Object>} Array de objetos con color y porcentaje
     */
    extractColors() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
        const pixels = [];
        
        // Adaptive sampling based on image size
        const totalPixels = this.canvas.width * this.canvas.height;
        const sampleRate = Math.max(1, Math.floor(Math.sqrt(totalPixels) / 100));
        
        // Collect samples with spatial distribution consideration
        for (let y = 0; y < this.canvas.height; y += sampleRate) {
            for (let x = 0; x < this.canvas.width; x += sampleRate) {
                const i = (y * this.canvas.width + x) * 4;
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];
                const a = imageData[i + 3];
                
                // Skip transparent pixels
                if (a < 127) continue;
                
                pixels.push(`rgb(${r}, ${g}, ${b})`);
            }
        }

        // Aumentar el número de clusters iniciales a 15
        let clusters = new Array(15).fill().map(() => {
            const randomIndex = Math.floor(Math.random() * pixels.length);
            return [pixels[randomIndex]];
        });

        // Run k-means clustering
        const maxIterations = 10;
        for (let iteration = 0; iteration < maxIterations; iteration++) {
            // Reset clusters keeping only centroids
            const centroids = clusters.map(cluster => this.findCentroid(cluster));
            clusters = centroids.map(() => []);

            // Assign pixels to nearest centroid
            pixels.forEach(pixel => {
                let minDistance = Infinity;
                let nearestCluster = 0;

                centroids.forEach((centroid, index) => {
                    if (!centroid) return;
                    const distance = this.colorDistance(pixel, centroid);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestCluster = index;
                    }
                });

                clusters[nearestCluster].push(pixel);
            });

            // Remove empty clusters
            clusters = clusters.filter(cluster => cluster.length > 0);
        }

        // Sort clusters by size (popularity)
        clusters.sort((a, b) => b.length - a.length);

        // Calculate total pixels for percentage
        const totalSampledPixels = pixels.length;

        // Modificar la extracción de colores finales
        const finalColors = [];
        const minColorDistance = 25; // Reducido ligeramente para permitir más variación

        for (const cluster of clusters) {
            const centroid = this.findCentroid(cluster);
            const percentage = (cluster.length / totalSampledPixels) * 100;
            
            // Check if color is diverse enough from already selected colors
            const isDiverse = finalColors.every(({ color }) => 
                this.colorDistance(centroid, color) > minColorDistance
            );

            if (isDiverse && percentage > 1) { // Solo incluir colores con más del 1% de presencia
                finalColors.push({
                    color: centroid,
                    percentage: Math.round(percentage)
                });
                if (finalColors.length === 10) break; // Aumentado a 10 colores máximo
            }
        }

        // Si no tenemos suficientes colores, añadir más desde los clusters restantes
        while (finalColors.length < 7 && clusters.length > finalColors.length) {
            const cluster = clusters[finalColors.length];
            const centroid = this.findCentroid(cluster);
            const percentage = (cluster.length / totalSampledPixels) * 100;
            
            if (!finalColors.find(c => c.color === centroid)) {
                finalColors.push({
                    color: centroid,
                    percentage: Math.round(percentage)
                });
            }
        }

        return finalColors;
    }

    /**
     * Muestra la paleta de colores en la interfaz
     * @param {Array<Object>} colors - Array de objetos con color y porcentaje
     */
    displayPalette(colors) {
        const paletteContainer = document.getElementById('colorPalette');
        const imagePanel = document.querySelector('.column.is-half:first-child .box');
        paletteContainer.innerHTML = '';

        this.currentPalette = colors;
        colors.forEach(({ color, percentage }) => {
            const colorBox = document.createElement('div');
            colorBox.className = 'column is-2 color-box';
            colorBox.style.backgroundColor = color;
            
            const colorInfo = document.createElement('div');
            colorInfo.className = 'color-code';
            
            const [r, g, b] = this.parseRgb(color);
            const [h, s, l] = this.rgbToHsl(r, g, b);
            
            const rgbFormat = `rgb(${r}, ${g}, ${b})`;
            colorInfo.textContent = `${rgbFormat}\n${percentage}%`;
            
            colorBox.onclick = () => {
                const textArea = document.createElement('textarea');
                textArea.value = rgbFormat;
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    this.showNotification('RGB copiado al portapapeles!');
                } catch (err) {
                    this.showNotification('Error al copiar el color', 'is-danger');
                }
                
                document.body.removeChild(textArea);
            };
            
            colorBox.appendChild(colorInfo);
            paletteContainer.appendChild(colorBox);
        });

        // Botones de exportación
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'buttons mt-4 is-centered';

        const exportButton = document.createElement('button');
        exportButton.className = 'button is-primary';
        exportButton.textContent = 'Exportar paleta';
        exportButton.onclick = () => this.exportPalette();
        buttonContainer.appendChild(exportButton);

        const complementaryButton = document.createElement('button');
        complementaryButton.className = 'button is-info';
        complementaryButton.textContent = 'Generar complementarios';
        complementaryButton.onclick = () => this.displayComplementaryPalette();
        buttonContainer.appendChild(complementaryButton);

        // Añadir los botones después de la imagen
        imagePanel.appendChild(buttonContainer);
    }

    /**
     * Muestra una notificación temporal
     * @param {string} message - Mensaje a mostrar
     * @param {string} [type='is-success'] - Tipo de notificación
     */
    showNotification(message, type = 'is-success') {
        const messages = {
            'RGB copiado al portapapeles!': 'RGB copiado al portapapeles!',
            'Error al copiar el color': 'Error al copiar el color',
            'No hay paleta para exportar': 'No hay paleta para exportar',
            'No hay paleta base para generar complementos': 'No hay paleta base para generar complementos',
            'No hay paleta para exportar variables': 'No hay paleta para exportar variables',
            'Paleta exportada como PNG exitosamente!': 'Paleta exportada como PNG exitosamente!',
            'Variables CSS exportadas exitosamente!': 'Variables CSS exportadas exitosamente!',
            'Variables SCSS exportadas exitosamente!': 'Variables SCSS exportadas exitosamente!'
        };

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = messages[message] || message;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    /**
     * Genera variables de color en formato CSS o SCSS
     * @param {string} [format='css'] - Formato de salida ('css' o 'scss')
     * @returns {string} Variables de color generadas
     */
    generateColorVariables(format = 'css') {
        if (!this.currentPalette.length) return '';
        
        const variables = [];
        this.currentPalette.forEach(({ color, percentage }, index) => {
            const [r, g, b] = this.parseRgb(color);
            const [h, s, l] = this.rgbToHsl(r, g, b);
            
            const colorName = `color-${index + 1}`;
            if (format === 'css') {
                variables.push(`--${colorName}: ${color};`);
                variables.push(`--${colorName}-rgb: ${r}, ${g}, ${b};`);
                variables.push(`--${colorName}-hsl: ${h}, ${s}%, ${l}%;`);
                variables.push(`--${colorName}-percentage: ${percentage}%;`);
            } else if (format === 'scss') {
                variables.push(`$${colorName}: ${color};`);
                variables.push(`$${colorName}-rgb: ${r}, ${g}, ${b};`);
                variables.push(`$${colorName}-hsl: ${h}, ${s}%, ${l}%;`);
                variables.push(`$${colorName}-percentage: ${percentage}%;`);
            }
        });
        
        if (format === 'css') {
            return `:root {\n  ${variables.join('\n  ')}\n}`;
        }
        return variables.join('\n');
    }

    /**
     * Exporta las variables de color en el formato especificado
     * @param {string} format - Formato de exportación ('css' o 'scss')
     */
    exportVariables(format) {
        const variables = this.generateColorVariables(format);
        if (!variables) {
            this.showNotification('No palette to export variables from', 'is-danger');
            return;
        }

        const blob = new Blob([variables], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = `palette-variables.${format === 'css' ? 'css' : 'scss'}`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
        
        this.showNotification(`${format.toUpperCase()} variables exported successfully!`);
    }

    /**
     * Muestra las opciones de exportación
     */
    exportPalette() {
        if (!this.currentPalette.length) {
            this.showNotification('No hay paleta para exportar', 'is-danger');
            return;
        }

        const imagePanel = document.querySelector('.column.is-half:first-child .box');
        
        // Remover opciones de exportación existentes si las hay
        const existingExport = imagePanel.querySelector('.export-options');
        if (existingExport) {
            existingExport.remove();
        }

        const exportContainer = document.createElement('div');
        exportContainer.className = 'export-options box mt-4';
        exportContainer.innerHTML = `
            <h3 class="title is-5">Opciones de exportación</h3>
            <div class="buttons is-centered is-wrapped">
                <button class="button is-primary m-2" id="exportPNG">Exportar como PNG</button>
                <button class="button is-info m-2" id="exportCSS">Exportar variables CSS</button>
                <button class="button is-info m-2" id="exportSCSS">Exportar variables SCSS</button>
                <button class="button is-success m-2" id="generateComplementary">Generar paleta complementaria</button>
            </div>
        `;

        // Añadir después de los botones existentes
        imagePanel.appendChild(exportContainer);

        document.getElementById('exportPNG').onclick = () => this.exportPaletteAsPNG();
        document.getElementById('exportCSS').onclick = () => this.exportVariables('css');
        document.getElementById('exportSCSS').onclick = () => this.exportVariables('scss');
        document.getElementById('generateComplementary').onclick = () => this.displayComplementaryPalette();
    }

    /**
     * Exporta la paleta como imagen PNG
     */
    exportPaletteAsPNG() {
        if (!this.currentPalette.length) {
            this.showNotification('No hay paleta para exportar', 'is-danger');
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const padding = 40;
        const colorHeight = 100;
        const labelHeight = 60;
        const sectionSpacing = 160;
        const titleHeight = 60;
        const titlePadding = 30;

        // Check if complementary palette exists
        const complementarySection = document.querySelector('#colorPalette .box.mt-4');
        const complementaryPalette = complementarySection ? this.generateComplementaryPalette() : [];
        
        // Calculate dimensions
        const totalSections = complementaryPalette.length > 0 ? 2 : 1;
        const colorsPerRow = 3;
        const rowsPerSection = Math.ceil(Math.max(this.currentPalette.length, complementaryPalette.length) / colorsPerRow);
        const width = 800;
        const height = (titleHeight + (colorHeight + labelHeight) * rowsPerSection) * totalSections + 
                      padding * 2 + (totalSections - 1) * (sectionSpacing + 40);

        canvas.width = width;
        canvas.height = height;

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Function to draw a palette section
        const drawPaletteSection = (palette, startY, title) => {
            // Draw section title with background
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(0, startY, width, titleHeight + titlePadding);
            
            ctx.fillStyle = '#363636';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(title, width/2, startY + titlePadding + 25);

            let x = padding;
            let y = startY + titleHeight + titlePadding + 20;
            let colCount = 0;

            palette.forEach(({ color, percentage }) => {
                // Draw color rectangle with border
                ctx.fillStyle = color;
                const colorWidth = (width - padding * 2) / colorsPerRow;
                ctx.fillRect(x, y, colorWidth - 10, colorHeight);
                
                // Draw labels
                ctx.fillStyle = '#363636';
                ctx.font = '16px monospace';
                ctx.textAlign = 'center';

                const [r, g, b] = this.parseRgb(color);
                const [h, s, l] = this.rgbToHsl(r, g, b);

                const rgbText = `RGB: ${r}, ${g}, ${b}`;
                const hslText = `HSL: ${h}°, ${s}%, ${l}%`;
                const percentText = `${percentage}%`;

                const centerX = x + (colorWidth - 10) / 2;
                ctx.fillText(rgbText, centerX, y + colorHeight + 20);
                ctx.fillText(hslText, centerX, y + colorHeight + 40);
                ctx.fillText(percentText, centerX, y + colorHeight + 60);

                colCount++;
                if (colCount === colorsPerRow) {
                    x = padding;
                    y += colorHeight + labelHeight;
                    colCount = 0;
                } else {
                    x += colorWidth;
                }
            });

            return y;
        };

        // Draw original palette
        let currentY = padding;
        currentY = drawPaletteSection(this.currentPalette, currentY, 'PALETA PRIMARIA');

        // Draw complementary palette if it exists
        if (complementaryPalette.length > 0) {
            currentY += sectionSpacing + 40;
            drawPaletteSection(complementaryPalette, currentY, 'PALETA COMPLEMENTARIA');
        }

        // Export canvas as PNG
        const link = document.createElement('a');
        link.download = 'paleta-de-colores.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        this.showNotification('Paleta exportada como PNG exitosamente!');
    }
}

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    window.colorPaletteGenerator = new ColorPaletteGenerator();
});