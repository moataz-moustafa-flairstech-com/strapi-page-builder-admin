class LayoutBuilder {
    constructor() {
        this.components = new Map();
        this.containers = new Map();
        this.draggedElement = null;
        this.draggedType = null; // 'component' or 'placed-component'
        this.containerCounter = 1;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Add component button
        document.getElementById('add-component-btn').addEventListener('click', () => {
            this.addComponent();
        });

        // Add root div button
        document.getElementById('add-root-div-btn').addEventListener('click', () => {
            this.addRootContainer();
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportStructure();
        });

        // Import button
        document.getElementById('import-btn').addEventListener('click', () => {
            this.importStructure();
        });

        // Enter key for adding components
        document.getElementById('new-component-id').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addComponent();
            }
        });

        // Setup components drop zone
        this.setupComponentsDropZone();
    }

    addComponent() {
        const input = document.getElementById('new-component-id');
        const componentId = input.value.trim();
        
        if (!componentId) {
            alert('Please enter a component ID');
            return;
        }

        if (this.components.has(componentId)) {
            alert('Component ID already exists');
            return;
        }

        // Create component element
        const componentEl = document.createElement('div');
        componentEl.className = 'component-item';
        componentEl.draggable = true;
        componentEl.dataset.componentId = componentId;

        componentEl.innerHTML = `
            <div class="component-name">${componentId}</div>
            <button class="control-btn" data-action="remove" title="Remove">×</button>
        `;

        // Add to components list
        const componentsList = document.getElementById('components-list');
        const dropZone = document.getElementById('components-drop-zone');
        componentsList.insertBefore(componentEl, dropZone);

        // Store component data
        this.components.set(componentId, {
            id: componentId,
            element: componentEl,
            container: null
        });

        // Setup drag and drop
        this.setupComponentDragAndDrop(componentEl);

        // Setup remove button
        componentEl.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeComponent(componentId);
        });

        // Clear input
        input.value = '';
    }

    removeComponent(componentId) {
        const component = this.components.get(componentId);
        if (component) {
            if (component.container) {
                // Remove from container
                const placedEl = component.container.element.querySelector(`[data-component-id="${componentId}"]`);
                if (placedEl) {
                    placedEl.remove();
                }
            }
            component.element.remove();
            this.components.delete(componentId);
        }
    }

    addRootContainer() {
        const rootLayout = document.getElementById('root-layout');
        
        // Remove initial drop zone if it exists
        const initialDropZone = rootLayout.querySelector('.drop-zone');
        if (initialDropZone && initialDropZone.textContent.includes('Click "Add Root Div"')) {
            initialDropZone.remove();
        }

        const container = this.createContainer('vertical');
        rootLayout.appendChild(container.element);
    }

    createContainer(type, parent = null) {
        const containerId = `container-${this.containerCounter++}`;
        
        const containerEl = document.createElement('div');
        containerEl.className = `layout-container ${type === 'leaf' ? 'leaf' : (type === 'non-leaf' ? 'non-leaf' : 'vertical')}`;
        containerEl.dataset.containerId = containerId;
        containerEl.dataset.containerType = type === 'leaf' ? 'leaf' : (type === 'non-leaf' ? 'non-leaf' : type);

        const headerEl = document.createElement('div');
        let containerClass = 'leaf';
        let iconType = 'leaf';
        
        if (type === 'non-leaf') {
            containerClass = 'non-leaf';
            iconType = 'non-leaf';
        } else if (type !== 'leaf') {
            containerClass = '';
            iconType = type;
        }

        headerEl.className = `container-header ${containerClass} layout-type-${iconType}`;

        const isLeafContainer = type === 'leaf';
        const isNonLeaf = type === 'non-leaf';

        headerEl.innerHTML = `
            <input 
                type="text" 
                placeholder="Container name" 
                value="${containerId}"
                class="container-name-input"
            >
            <button class="control-btn" data-action="split-horizontal" title="Split Horizontal">↔</button>
            <button class="control-btn" data-action="split-vertical" title="Split Vertical">↕</button>
            <button class="control-btn" data-action="remove" title="Remove">×</button>
        `;

        containerEl.appendChild(headerEl);

        // Store container data
        const containerData = {
            id: containerId,
            type: isLeafContainer ? 'leaf' : (isNonLeaf ? 'non-leaf' : type),
            element: containerEl,
            parent: parent,
            children: [],
            component: null,
            name: containerId
        };

        this.containers.set(containerId, containerData);

        if (isLeafContainer) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.textContent = 'Drop component here';
            containerEl.appendChild(dropZone);
            this.setupContainerDropZone(dropZone, containerId);
        } else if (isNonLeaf) {
            // Non-leaf container with no children initially
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'drop-zone';
            emptyMessage.textContent = 'Split this container to add children';
            containerEl.appendChild(emptyMessage);
        } else {
            // Add initial leaf container for parent containers (vertical/horizontal)
            const leafContainer = this.createContainer('leaf', containerId);
            containerEl.appendChild(leafContainer.element);
            containerData.children = [leafContainer.id];
        }

        // Setup event listeners
        this.setupContainerEventListeners(containerEl, containerId);

        return containerData;
    }

    setupContainerEventListeners(containerEl, containerId) {
        const header = containerEl.querySelector('.container-header');
        
        // Name input
        const nameInput = header.querySelector('.container-name-input');
        nameInput.addEventListener('change', () => {
            const container = this.containers.get(containerId);
            if (container) {
                container.name = nameInput.value || containerId;
            }
        });

        // Control buttons
        const splitHorizontalBtn = header.querySelector('[data-action="split-horizontal"]');
        const splitVerticalBtn = header.querySelector('[data-action="split-vertical"]');
        const removeBtn = header.querySelector('[data-action="remove"]');

        if (splitHorizontalBtn) {
            splitHorizontalBtn.addEventListener('click', () => {
                this.splitContainer(containerId, 'horizontal');
            });
        }

        if (splitVerticalBtn) {
            splitVerticalBtn.addEventListener('click', () => {
                this.splitContainer(containerId, 'vertical');
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                this.removeContainer(containerId);
            });
        }
    }

    splitContainer(containerId, direction) {
        const container = this.containers.get(containerId);
        if (!container) return;

        // Only allow splitting if:
        // 1. Container is non-leaf, OR
        // 2. Container is leaf but has no component (empty)
        if (container.type === 'leaf' && container.component) return;

        // If it's a leaf container, convert it to a parent container
        if (container.type === 'leaf') {
            // Remove the drop zone
            const dropZone = container.element.querySelector('.drop-zone');
            if (dropZone) {
                dropZone.remove();
            }

            // Update container type and styling
            container.type = direction;
            container.element.className = `layout-container ${direction}`;
            container.element.dataset.containerType = direction;

            // Update header to show split buttons and remove leaf styling
            const header = container.element.querySelector('.container-header');
            header.className = `container-header layout-type-${direction}`;
            
            // Update header HTML to include split buttons
            const nameInput = header.querySelector('.container-name-input');
            const currentName = nameInput.value;
            header.innerHTML = `
                <input 
                    type="text" 
                    placeholder="Container name" 
                    value="${currentName}"
                    class="container-name-input"
                >
                <button class="control-btn" data-action="split-horizontal" title="Split Horizontal">↔</button>
                <button class="control-btn" data-action="split-vertical" title="Split Vertical">↕</button>
                <button class="control-btn" data-action="remove" title="Remove">×</button>
            `;

            // Re-setup event listeners for the updated header
            this.setupContainerEventListeners(container.element, containerId);
        } else {
            // Update existing parent container type and class
            container.type = direction;
            container.element.className = `layout-container ${direction}`;
            container.element.dataset.containerType = direction;
            
            // Update header class and icon
            const header = container.element.querySelector('.container-header');
            header.className = `container-header layout-type-${direction}`;

            // Remove any existing empty message
            const emptyMessage = container.element.querySelector('.drop-zone');
            if (emptyMessage) {
                emptyMessage.remove();
            }
        }

        // Add two leaf containers
        const leaf1 = this.createContainer('leaf', containerId);
        const leaf2 = this.createContainer('leaf', containerId);
        
        container.element.appendChild(leaf1.element);
        container.element.appendChild(leaf2.element);
        
        // Update children array
        container.children = [leaf1.id, leaf2.id];
    }

    removeContainer(containerId) {
        const container = this.containers.get(containerId);
        if (!container) return;

        // Remove component if assigned
        if (container.component) {
            this.returnComponentToList(container.component);
        }

        // Remove from DOM
        container.element.remove();
        
        // Remove from containers map
        this.containers.delete(containerId);
    }

    setupComponentDragAndDrop(componentEl) {
        componentEl.addEventListener('dragstart', (e) => {
            this.draggedElement = componentEl;
            this.draggedType = 'component';
            componentEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        componentEl.addEventListener('dragend', () => {
            componentEl.classList.remove('dragging');
            this.draggedElement = null;
            this.draggedType = null;
        });
    }

    setupPlacedComponentDragAndDrop(placedEl, componentId) {
        placedEl.addEventListener('dragstart', (e) => {
            this.draggedElement = placedEl;
            this.draggedType = 'placed-component';
            this.draggedComponentId = componentId;
            placedEl.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        placedEl.addEventListener('dragend', () => {
            placedEl.classList.remove('dragging');
            this.draggedElement = null;
            this.draggedType = null;
            this.draggedComponentId = null;
        });
    }

    setupContainerDropZone(dropZone, containerId) {
        dropZone.addEventListener('dragover', (e) => {
            const container = this.containers.get(containerId);
            // Only allow drops on leaf containers
            if ((this.draggedType === 'component' || this.draggedType === 'placed-component') && 
                container && container.type === 'leaf') {
                e.preventDefault();
                dropZone.classList.add('active');
            }
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');

            const container = this.containers.get(containerId);
            // Only allow drops on leaf containers
            if (!container || container.type !== 'leaf') return;

            if (this.draggedType === 'component') {
                this.placeComponentInContainer(this.draggedElement.dataset.componentId, containerId);
            } else if (this.draggedType === 'placed-component') {
                this.moveComponentToContainer(this.draggedComponentId, containerId);
            }
        });
    }

    setupComponentsDropZone() {
        const dropZone = document.getElementById('components-drop-zone');
        
        dropZone.addEventListener('dragover', (e) => {
            if (this.draggedType === 'placed-component') {
                e.preventDefault();
                dropZone.classList.add('active');
            }
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');

            if (this.draggedType === 'placed-component') {
                this.returnComponentToList(this.draggedComponentId);
            }
        });
    }

    placeComponentInContainer(componentId, containerId) {
        const component = this.components.get(componentId);
        const container = this.containers.get(containerId);
        
        if (!component || !container || container.type !== 'leaf' || container.component) return;

        // Remove from current container if any
        if (component.container) {
            const oldPlaced = component.container.element.querySelector(`[data-component-id="${componentId}"]`);
            if (oldPlaced) {
                oldPlaced.remove();
                // Restore drop zone in old container
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.textContent = 'Drop component here';
                component.container.element.appendChild(dropZone);
                this.setupContainerDropZone(dropZone, component.container.id);
            }
            component.container.component = null;
        }

        // Hide component from list
        component.element.style.display = 'none';

        // Create placed component element
        const placedEl = document.createElement('div');
        placedEl.className = 'placed-component';
        placedEl.draggable = true;
        placedEl.dataset.componentId = componentId;
        placedEl.textContent = componentId;

        // Replace drop zone with placed component
        const dropZone = container.element.querySelector('.drop-zone');
        if (dropZone) {
            container.element.replaceChild(placedEl, dropZone);
        }

        // Update references
        component.container = container;
        container.component = componentId;

        // Setup drag and drop for placed component
        this.setupPlacedComponentDragAndDrop(placedEl, componentId);
    }

    moveComponentToContainer(componentId, newContainerId) {
        const component = this.components.get(componentId);
        const newContainer = this.containers.get(newContainerId);
        
        if (!component || !newContainer || newContainer.type !== 'leaf' || newContainer.component) return;

        // Remove from old container
        if (component.container) {
            const oldPlaced = component.container.element.querySelector(`[data-component-id="${componentId}"]`);
            if (oldPlaced) {
                // Create drop zone in old container
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.textContent = 'Drop component here';
                component.container.element.replaceChild(dropZone, oldPlaced);
                this.setupContainerDropZone(dropZone, component.container.id);
            }
            component.container.component = null;
        }

        // Place in new container
        this.placeComponentInContainer(componentId, newContainerId);
    }

    returnComponentToList(componentId) {
        const component = this.components.get(componentId);
        if (!component) return;

        // Remove from container
        if (component.container) {
            const placedEl = component.container.element.querySelector(`[data-component-id="${componentId}"]`);
            if (placedEl) {
                // Create drop zone in container
                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.textContent = 'Drop component here';
                component.container.element.replaceChild(dropZone, placedEl);
                this.setupContainerDropZone(dropZone, component.container.id);
            }
            component.container.component = null;
            component.container = null;
        }

        // Show component in list
        component.element.style.display = 'flex';
    }

    exportStructure() {
        const structure = {
            components: {},
            layout: {},
            relations: {}
        };

        // Export components
        this.components.forEach((component, id) => {
            structure.components[id] = {
                id: id,
                containerId: component.container ? component.container.id : null
            };
        });

        // Export layout containers
        this.containers.forEach((container, id) => {
            structure.layout[id] = {
                id: id,
                name: container.name,
                type: container.type,
                parentId: container.parent,
                componentId: container.component,
                children: container.children || []
            };
        });

        // Export relations
        this.components.forEach((component, id) => {
            if (component.container) {
                structure.relations[id] = component.container.id;
            }
        });

        // Display JSON
        const jsonOutput = document.getElementById('json-output');
        jsonOutput.textContent = JSON.stringify(structure, null, 2);
        jsonOutput.classList.remove('hidden');

        // Copy to clipboard
        navigator.clipboard.writeText(JSON.stringify(structure, null, 2)).then(() => {
            alert('JSON structure copied to clipboard!');
        }).catch(() => {
            alert('JSON structure displayed below (copy manually if needed)');
        });
    }

    importStructure() {
        const jsonInput = document.getElementById('json-input');
        const jsonText = jsonInput.value.trim();

        if (!jsonText) {
            alert('Please enter JSON structure to import');
            return;
        }

        try {
            const structure = JSON.parse(jsonText);
            this.loadFromStructure(structure);
            jsonInput.value = '';
            alert('Layout loaded successfully!');
        } catch (error) {
            alert('Invalid JSON format: ' + error.message);
        }
    }

    loadFromStructure(structure) {
        // Clear existing data
        this.clearAll();

        if (!structure.components || !structure.layout) {
            return;
        }

        // Create components first
        Object.values(structure.components).forEach(compData => {
            this.createComponentFromData(compData);
        });

        // Create containers in proper order (parents first)
        const containerIds = Object.keys(structure.layout);
        const rootContainers = containerIds.filter(id => !structure.layout[id].parentId);
        
        // Create root containers first
        rootContainers.forEach(id => {
            this.createContainerFromData(structure.layout[id], structure.layout);
        });

        // Place components in containers
        Object.values(structure.components).forEach(compData => {
            if (compData.containerId) {
                this.placeComponentInContainer(compData.id, compData.containerId);
            }
        });
    }

    createComponentFromData(compData) {
        // Create component element
        const componentEl = document.createElement('div');
        componentEl.className = 'component-item';
        componentEl.draggable = true;
        componentEl.dataset.componentId = compData.id;

        componentEl.innerHTML = `
            <div class="component-name">${compData.id}</div>
            <button class="control-btn" data-action="remove" title="Remove">×</button>
        `;

        // Add to components list
        const componentsList = document.getElementById('components-list');
        const dropZone = document.getElementById('components-drop-zone');
        componentsList.insertBefore(componentEl, dropZone);

        // Store component data
        this.components.set(compData.id, {
            id: compData.id,
            element: componentEl,
            container: null
        });

        // Setup drag and drop
        this.setupComponentDragAndDrop(componentEl);

        // Setup remove button
        componentEl.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeComponent(compData.id);
        });
    }

    createContainerFromData(containerData, allContainers) {
        const containerId = containerData.id;
        
        // Skip if already created
        if (this.containers.has(containerId)) {
            return this.containers.get(containerId);
        }

        const containerEl = document.createElement('div');
        const containerType = containerData.type;
        const isLeaf = containerType === 'leaf';
        const isNonLeaf = containerType === 'non-leaf';

        containerEl.className = `layout-container ${isLeaf ? 'leaf' : (isNonLeaf ? 'non-leaf' : containerType)}`;
        containerEl.dataset.containerId = containerId;
        containerEl.dataset.containerType = containerType;

        const headerEl = document.createElement('div');
        let headerClass = '';
        let iconType = containerType;
        
        if (isLeaf) {
            headerClass = 'leaf';
        } else if (isNonLeaf) {
            headerClass = 'non-leaf';
            iconType = 'non-leaf';
        }

        headerEl.className = `container-header ${headerClass} layout-type-${iconType}`;

        headerEl.innerHTML = `
            <input 
                type="text" 
                placeholder="Container name" 
                value="${containerData.name || containerId}"
                class="container-name-input"
            >
            <button class="control-btn" data-action="split-horizontal" title="Split Horizontal">↔</button>
            <button class="control-btn" data-action="split-vertical" title="Split Vertical">↕</button>
            <button class="control-btn" data-action="remove" title="Remove">×</button>
        `;

        containerEl.appendChild(headerEl);

        // Handle container content based on type and children
        if (isLeaf) {
            const dropZone = document.createElement('div');
            dropZone.className = 'drop-zone';
            dropZone.textContent = 'Drop component here';
            containerEl.appendChild(dropZone);
            this.setupContainerDropZone(dropZone, containerId);
        } else if (containerData.children && containerData.children.length > 0) {
            // Create child containers
            containerData.children.forEach(childId => {
                if (allContainers[childId]) {
                    const childContainer = this.createContainerFromData(allContainers[childId], allContainers);
                    containerEl.appendChild(childContainer.element);
                }
            });
        } else {
            // Non-leaf with no children
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'drop-zone';
            emptyMessage.textContent = 'Split this container to add children';
            containerEl.appendChild(emptyMessage);
        }

        // Store container data
        const container = {
            id: containerId,
            type: containerType,
            element: containerEl,
            parent: containerData.parentId,
            children: containerData.children || [],
            component: containerData.componentId,
            name: containerData.name || containerId
        };

        this.containers.set(containerId, container);

        // Add to parent or root
        if (!containerData.parentId) {
            const rootLayout = document.getElementById('root-layout');
            // Remove initial drop zone if it exists
            const initialDropZone = rootLayout.querySelector('.drop-zone');
            if (initialDropZone && initialDropZone.textContent.includes('Click "Add Root Div"')) {
                initialDropZone.remove();
            }
            rootLayout.appendChild(containerEl);
        }

        // Setup event listeners
        this.setupContainerEventListeners(containerEl, containerId);

        // Update counter to avoid ID conflicts
        const counterMatch = containerId.match(/container-(\d+)/);
        if (counterMatch) {
            const num = parseInt(counterMatch[1]);
            if (num >= this.containerCounter) {
                this.containerCounter = num + 1;
            }
        }

        return container;
    }

    clearAll() {
        // Clear components
        this.components.forEach(component => {
            component.element.remove();
        });
        this.components.clear();

        // Clear containers
        this.containers.forEach(container => {
            container.element.remove();
        });
        this.containers.clear();

        // Reset counter
        this.containerCounter = 1;

        // Add initial drop zone back
        const rootLayout = document.getElementById('root-layout');
        rootLayout.innerHTML = `
            <div class="drop-zone">
                Click "Add Root Div" to start building your layout
            </div>
        `;
    }
}


function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';'); // Split into individual cookies
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') { // Remove leading whitespace
      c = c.substring(1, c.length);
    }
    if (c.indexOf(nameEQ) === 0) { // Check if this is the desired cookie
      return decodeURIComponent(c.substring(nameEQ.length, c.length)); // Return decoded value
    }
  }
  return null; // Return null if cookie not found
}

// Initialize the application. Expose init on window and support immediate init
function initLayoutBuilder() {
    // avoid double-init
    if (window.__layoutBuilderInstance) return window.__layoutBuilderInstance;

    const builder = new LayoutBuilder();
    window.__layoutBuilderInstance = builder;

    // On load: if documentId provided, fetch page-template and load layout_structure
    const params = new URLSearchParams(window.location.search);
    const documentId = params.get('documentId');
    const tokenFromQuery = getCookie('jwtToken');

    function buildAuthHeaders(token) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    if (documentId) {
        const apiUrl = `/api/page-templates/${encodeURIComponent(documentId)}?populate=*`;
        const token = tokenFromQuery;

        fetch(apiUrl, {  })
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch page template: ' + res.status);
                return res.json();
            })
            .then(body => {
                const data = body && body.data ? body.data : body;
                // Set page-builder title from template name if available
                try {
                    const titleEl = document.getElementById('layout-builder-title');
                    if (titleEl && data.name) {
                        titleEl.innerHTML = data.name;
                    }
                } catch (e) {}

                if (data && data.layout_structure) {
                    try {
                        builder.loadFromStructure(data.layout_structure);
                    } catch (err) {
                        console.error('Failed to load layout_structure:', err);
                        alert('Failed to load layout_structure: ' + err.message);
                    }
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    // Override exportStructure to also save to API when documentId present
    const originalExport = builder.exportStructure.bind(builder);
    builder.exportStructure = function() {
        originalExport();

        const params = new URLSearchParams(window.location.search);
        const documentId = params.get('documentId');
        const token =  getCookie('jwtToken');

        // Build the structure again to get latest
        const structure = (function(b) {
            const s = { components: {}, layout: {}, relations: {} };
            b.components.forEach((component, id) => {
                s.components[id] = { id: id, containerId: component.container ? component.container.id : null };
            });
            b.containers.forEach((container, id) => {
                s.layout[id] = {
                    id: id,
                    name: container.name,
                    type: container.type,
                    parentId: container.parent,
                    componentId: container.component,
                    children: container.children || []
                };
            });
            b.components.forEach((component, id) => {
                if (component.container) s.relations[id] = component.container.id;
            });
            return s;
        })(builder);

        if (documentId) {
            const apiUrl = `/api/page-templates/${encodeURIComponent(documentId)}`;
            const payload = { data: { layout_structure: structure } };

            fetch(apiUrl, {
                method: 'PUT',
                headers: {
                    "Content-Type": "application/json", // <— must include this
                },
                body: JSON.stringify(payload)
            }).then(res => {
                if (!res.ok) throw new Error('Save failed: ' + res.status);
                return res.json();
            }).then(() => {
                const status = document.getElementById('save-status');
                if (status) {
                    status.textContent = 'Layout saved to page-template.layout_structure ✓';
                    status.style.color = 'green';
                    setTimeout(() => { status.textContent = ''; }, 3000);
                }
            }).catch(err => {
                console.error(err);
                const status = document.getElementById('save-status');
                if (status) {
                    status.textContent = 'Failed to save layout: ' + err.message;
                    status.style.color = 'red';
                }
            });
        }
    };

    return builder;
}

// Expose an init function for SPAs (admin) and auto-init when document already loaded
if (typeof window !== 'undefined') {
    window.initLayoutBuilder = initLayoutBuilder;
}

if (document.readyState !== 'loading') {
    // document already parsed, init immediately
    try { initLayoutBuilder(); } catch (e) { console.error(e); }
} else {
    document.addEventListener('DOMContentLoaded', initLayoutBuilder);
}