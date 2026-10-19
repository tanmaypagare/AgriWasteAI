const input = document.querySelector('#file-input');
const dropzone = document.querySelector('#dropzone');
const uploadContent = document.querySelector('#upload-content');
const previewWrap = document.querySelector('#preview-wrap');
const previewImage = document.querySelector('#preview-image');
const fileName = document.querySelector('#file-name');
const discoverButton = document.querySelector('#discover-button');
const toast = document.querySelector('#toast');
const supportedMaterials = {
  'rice husk': '🌾',
  'corn husk': '🌽',
  'banana husk': '🍃',
  'coconut waste': '🥥',
  'sugarcane bagasse': '🎋'
};
let imageUrl = null;
let selectedFile = null;
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function updateButton() {
  discoverButton.disabled = !selectedFile || discoverButton.dataset.loading === 'true';
}

function clearImage() {
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  imageUrl = null;
  selectedFile = null;
  input.value = '';
  previewImage.removeAttribute('src');
  previewWrap.hidden = true;
  uploadContent.hidden = false;
  updateButton();
}

function loadImage(file) {
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showToast('Please choose a JPG, PNG, or WEBP image.');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('That image is over 10 MB. Please choose a smaller file.');
    return;
  }
  if (imageUrl) URL.revokeObjectURL(imageUrl);
  selectedFile = file;
  imageUrl = URL.createObjectURL(file);
  document.querySelector('#results').hidden = true;
  previewImage.src = imageUrl;
  fileName.textContent = file.name;
  previewWrap.hidden = false;
  uploadContent.hidden = true;
  updateButton();
}

document.querySelector('#browse-button').addEventListener('click', (event) => {
  event.stopPropagation();
  input.click();
});
dropzone.addEventListener('click', (event) => {
  if (event.target.closest('button')) return;
  input.click();
});
dropzone.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
});
input.addEventListener('change', () => loadImage(input.files[0]));
document.querySelector('#remove-image').addEventListener('click', (event) => {
  event.stopPropagation();
  clearImage();
});
for (const eventName of ['dragenter', 'dragover']) {
  dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.add('dragover'); });
}
for (const eventName of ['dragleave', 'drop']) {
  dropzone.addEventListener(eventName, (event) => { event.preventDefault(); dropzone.classList.remove('dragover'); });
}
dropzone.addEventListener('drop', (event) => loadImage(event.dataTransfer.files[0]));

function renderResults(result) {
  const materialName = String(result.material || '').trim();
  const normalized = materialName.toLowerCase();
  document.querySelector('#result-title').textContent = 'A new life for your material.';
  document.querySelector('#result-icon').textContent = supportedMaterials[normalized] || '🌱';
  document.querySelector('#result-material').textContent = materialName;
  const confidence = Number(result.confidence);
  document.querySelector('#confidence').textContent = Number.isFinite(confidence)
    ? `Model confidence: ${Math.round(Math.max(0, Math.min(1, confidence)) * 100)}%`
    : '';
  document.querySelector('#result-description').textContent = result.description || '';
  const ideas = Array.isArray(result.ideas) ? result.ideas.slice(0, 3) : [];
  document.querySelector('#ideas-grid').innerHTML = ideas.map((idea, index) => {
    const title = escapeHtml(idea.title || `Product idea ${index + 1}`);
    const description = escapeHtml(idea.description || '');
    const tag = escapeHtml(idea.tag || 'POTENTIAL USE');
    return `<article class="idea-card"><span class="idea-number">0${index + 1}</span><h3>${title}</h3><p>${description}</p><span class="idea-tag">${tag}</span></article>`;
  }).join('');
  const results = document.querySelector('#results');
  results.hidden = false;
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function setLoading(loading) {
  discoverButton.dataset.loading = String(loading);
  discoverButton.querySelector('span:first-child').textContent = loading ? 'Analyzing your image…' : 'Discover its potential';
  updateButton();
}

discoverButton.addEventListener('click', async () => {
  if (!selectedFile || discoverButton.dataset.loading === 'true') return;
  setLoading(true);
  try {
    const form = new FormData();
    form.append('image', selectedFile);
    const response = await fetch('/api/analyze', { method: 'POST', body: form });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (response.status === 404) {
        throw new Error('The page is running on Live Server. Open the URL printed by `python3 server.py` (usually http://127.0.0.1:8000) so image analysis reaches the backend.');
      }
      throw new Error('The backend did not return a valid response. Open the URL printed by `python3 server.py` and try again.');
    }
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'The image could not be analyzed. Please try again.');
    if (!payload.supported) {
      showToast(payload.message || 'This image does not appear to show one of the five supported waste types.');
      return;
    }
    renderResults(payload);
  } catch (error) {
    showToast(error.message || 'Could not reach the analysis service. Make sure the local server is running.');
  } finally {
    setLoading(false);
  }
});

document.querySelector('#start-over').addEventListener('click', () => {
  clearImage();
  document.querySelector('#results').hidden = true;
  document.querySelector('#start').scrollIntoView({ behavior: 'smooth' });
});
