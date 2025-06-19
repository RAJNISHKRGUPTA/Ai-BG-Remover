document.addEventListener('DOMContentLoaded', () => {
    const apiKey = 'Yh7A57CDrveNLSVtGFKsSgeh'; // YOUR remove.bg API KEY

    const imageUpload = document.getElementById('imageUpload');
    const fileNameDisplay = document.querySelector('.file-name-display');
    const removeBgButton = document.getElementById('removeBgButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const apiErrorDisplay = document.getElementById('apiError');

    const resultsSection = document.querySelector('.results-section');
    const originalImagePreview = document.getElementById('originalImagePreview');
    const resultImagePreview = document.getElementById('resultImagePreview');

    const keepTransparentButton = document.getElementById('keepTransparentButton');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const applyColorBgButton = document.getElementById('applyColorBgButton');
    const bgImageUpload = document.getElementById('bgImageUpload');
    const bgFileNameDisplay = document.querySelector('.bg-file-name-display');
    const applyImageBgButton = document.getElementById('applyImageBgButton');
    const downloadButton = document.getElementById('downloadButton');

    let originalFile = null;
    let currentResultBlob = null; // To store the blob of the latest processed image (transparent or with bg)

    // --- Event Listeners ---

    imageUpload.addEventListener('change', (event) => {
        originalFile = event.target.files[0];
        if (originalFile) {
            fileNameDisplay.textContent = originalFile.name;
            originalImagePreview.src = URL.createObjectURL(originalFile);
            removeBgButton.disabled = false;
            resultsSection.style.display = 'none'; // Hide results if a new image is uploaded
            apiErrorDisplay.style.display = 'none';
            resetBackgroundOptions();
        } else {
            fileNameDisplay.textContent = '';
            removeBgButton.disabled = true;
        }
    });

    removeBgButton.addEventListener('click', () => {
        if (!originalFile) {
            alert('Please upload an image first.');
            return;
        }
        processImage(); // Process for transparent background
    });

    keepTransparentButton.addEventListener('click', () => {
        if (!originalFile) return;
        // Re-process with no background options to ensure it's transparent
        processImage();
    });

    applyColorBgButton.addEventListener('click', () => {
        if (!originalFile) return;
        const bgColor = bgColorPicker.value;
        processImage({ bg_color: bgColor.substring(1) }); // Remove #
    });

    bgImageUpload.addEventListener('change', (event) => {
        const bgFile = event.target.files[0];
        if (bgFile) {
            bgFileNameDisplay.textContent = `Selected: ${bgFile.name}`;
            applyImageBgButton.disabled = false;
        } else {
            bgFileNameDisplay.textContent = ``;
            applyImageBgButton.disabled = true;
        }
    });
    
    applyImageBgButton.addEventListener('click', () => {
        if (!originalFile) return;
        const bgFile = bgImageUpload.files[0];
        if (!bgFile) {
            alert('Please select a background image file.');
            return;
        }
        processImage({ bg_image_file: bgFile });
    });

    downloadButton.addEventListener('click', () => {
        if (currentResultBlob) {
            const url = URL.createObjectURL(currentResultBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `removed_bg_${originalFile ? originalFile.name.split('.')[0] : 'image'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            alert('No image processed yet to download.');
        }
    });

    // --- Core Processing Function ---
    async function processImage(options = {}) {
        if (!originalFile) {
            alert('Original image not found.');
            return;
        }

        showLoading(true);
        apiErrorDisplay.style.display = 'none';
        resultsSection.style.display = 'none'; // Hide results until new ones are ready

        const formData = new FormData();
        formData.append('image_file', originalFile);
        formData.append('size', 'auto'); // 'auto', 'preview', 'full', etc.

        if (options.bg_color) {
            formData.append('bg_color', options.bg_color);
        }
        if (options.bg_image_file) {
            formData.append('bg_image_file', options.bg_image_file);
        }
        // You can also add 'bg_image_url' if you want to use a URL for background

        try {
            const response = await fetch('https://api.remove.bg/v1.0/removebg', {
                method: 'POST',
                headers: {
                    'X-Api-Key': apiKey,
                },
                body: formData,
            });

            if (response.ok) {
                currentResultBlob = await response.blob();
                resultImagePreview.src = URL.createObjectURL(currentResultBlob);
                originalImagePreview.src = URL.createObjectURL(originalFile); // Keep original visible
                resultsSection.style.display = 'block';
            } else {
                const errorData = await response.json(); // remove.bg sends JSON errors
                console.error('API Error:', errorData);
                let errorMessage = 'Failed to remove background.';
                if (errorData.errors && errorData.errors.length > 0) {
                    errorMessage += ` Details: ${errorData.errors[0].title}`;
                    if(errorData.errors[0].code === "insufficient_credits") {
                        errorMessage += " You may have run out of free credits or previews for the month.";
                    }
                }
                displayApiError(errorMessage);
            }
        } catch (error) {
            console.error('Network or other error:', error);
            displayApiError('An error occurred. Check console for details.');
        } finally {
            showLoading(false);
        }
    }

    // --- Helper Functions ---
    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
        removeBgButton.disabled = isLoading;
        applyColorBgButton.disabled = isLoading;
        applyImageBgButton.disabled = isLoading || !bgImageUpload.files[0];
        keepTransparentButton.disabled = isLoading;
        downloadButton.disabled = isLoading;
    }

    function displayApiError(message) {
        apiErrorDisplay.textContent = message;
        apiErrorDisplay.style.display = 'block';
    }
    
    function resetBackgroundOptions() {
        bgColorPicker.value = '#ffffff';
        bgImageUpload.value = ''; // Clear file input
        bgFileNameDisplay.textContent = '';
        applyImageBgButton.disabled = true;
        currentResultBlob = null; // Reset blob
    }

});