import JSZip from './node_modules/jszip/dist/jszip.min.js';

class ZipExtractor {
    constructor() {
        this.extractBtn = document.getElementById('extractBtn');
        this.status = document.getElementById('status');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressBar = document.getElementById('progressBar');
        this.fileListContainer = document.getElementById('fileListContainer');
        this.fileList = document.getElementById('fileList');
        
        this.init();
    }
    
    init() {
        this.extractBtn.addEventListener('click', () => this.extractArchive());
    }
    
    showStatus(message, type = 'info') {
        this.status.innerHTML = message;
        this.status.className = `status ${type}`;
        this.status.style.display = 'block';
    }
    
    updateProgress(percent) {
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = `${percent}%`;
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async extractArchive() {
        try {
            this.extractBtn.disabled = true;
            this.showStatus('Loading Archive.zip...', 'info');
            
            // Fetch the ZIP file
            const response = await fetch('./Archive.zip');
            if (!response.ok) {
                throw new Error(`Failed to load Archive.zip: ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            this.showStatus('Reading ZIP file...', 'info');
            
            // Load the ZIP file
            const zip = new JSZip();
            const zipData = await zip.loadAsync(arrayBuffer);
            
            this.showStatus('Extracting files...', 'info');
            
            const files = Object.keys(zipData.files);
            const extractedFiles = [];
            let processedFiles = 0;
            
            // Extract each file
            for (const filename of files) {
                const file = zipData.files[filename];
                
                if (!file.dir) {
                    try {
                        // Get file content as blob
                        const content = await file.async('blob');
                        
                        // Create download link for the file
                        const url = URL.createObjectURL(content);
                        
                        extractedFiles.push({
                            name: filename,
                            size: content.size,
                            url: url,
                            type: content.type || 'application/octet-stream'
                        });
                        
                        // Auto-download the file
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = filename.split('/').pop(); // Get just the filename
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                    } catch (fileError) {
                        console.warn(`Failed to extract ${filename}:`, fileError);
                    }
                }
                
                processedFiles++;
                this.updateProgress((processedFiles / files.length) * 100);
            }
            
            // Display results
            this.displayExtractedFiles(extractedFiles);
            this.showStatus(
                `✅ Successfully extracted ${extractedFiles.length} files from Archive.zip`, 
                'success'
            );
            
        } catch (error) {
            console.error('Extraction error:', error);
            this.showStatus(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.extractBtn.disabled = false;
            this.progressContainer.style.display = 'none';
        }
    }
    
    displayExtractedFiles(files) {
        this.fileList.innerHTML = '';
        
        files.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            fileItem.innerHTML = `
                <span class="file-name">${file.name}</span>
                <span class="file-size">${this.formatFileSize(file.size)}</span>
            `;
            
            this.fileList.appendChild(fileItem);
        });
        
        this.fileListContainer.style.display = 'block';
    }
}

// Initialize the extractor when the page loads
window.addEventListener('load', () => {
    new ZipExtractor();
});