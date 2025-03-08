// Конфигурация
const config = {
    apiUrl: 'http://localhost:3000/api', // Замените на ваш API URL
    itemsPerPage: 10
};

// Состояние приложения
let state = {
    currentPage: 1,
    totalPages: 1,
    requests: [],
    filters: {
        status: 'all',
        type: 'all',
        search: ''
    }
};

// DOM элементы
const loginForm = document.getElementById('loginForm');
const adminPanel = document.getElementById('adminPanel');
const requestsTableBody = document.getElementById('requestsTableBody');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchInput');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');
const requestModal = document.getElementById('requestModal');
const closeModalBtn = document.getElementById('closeModal');
const saveRequestBtn = document.getElementById('saveRequest');
const logoutBtn = document.getElementById('logoutBtn');

// Обработчики событий
document.addEventListener('DOMContentLoaded', () => {
    // Проверка авторизации
    checkAuth();

    // Обработчики форм
    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    // Обработчики фильтров
    statusFilter.addEventListener('change', handleFilterChange);
    typeFilter.addEventListener('change', handleFilterChange);
    searchInput.addEventListener('input', debounce(handleFilterChange, 300));

    // Обработчики пагинации
    prevPageBtn.addEventListener('click', () => changePage(state.currentPage - 1));
    nextPageBtn.addEventListener('click', () => changePage(state.currentPage + 1));

    // Обработчики модального окна
    closeModalBtn.addEventListener('click', closeModal);
    saveRequestBtn.addEventListener('click', handleSaveRequest);
});

// Функции авторизации
async function checkAuth() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        try {
            const response = await fetch(`${config.apiUrl}/auth/check`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                showAdminPanel();
                loadRequests();
            } else {
                handleLogout();
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            handleLogout();
        }
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(`${config.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const { token } = await response.json();
            localStorage.setItem('adminToken', token);
            showAdminPanel();
            loadRequests();
        } else {
            alert('Неверный логин или пароль');
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        alert('Произошла ошибка при входе');
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    showLoginForm();
}

// Функции отображения
function showAdminPanel() {
    loginForm.style.display = 'none';
    adminPanel.style.display = 'block';
}

function showLoginForm() {
    loginForm.style.display = 'block';
    adminPanel.style.display = 'none';
}

// Функции работы с заявками
async function loadRequests() {
    try {
        const response = await fetch(`${config.apiUrl}/requests`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            state.requests = data.requests;
            state.totalPages = Math.ceil(data.total / config.itemsPerPage);
            updateTable();
            updatePagination();
        }
    } catch (error) {
        console.error('Ошибка загрузки заявок:', error);
    }
}

function updateTable() {
    const filteredRequests = filterRequests();
    const startIndex = (state.currentPage - 1) * config.itemsPerPage;
    const endIndex = startIndex + config.itemsPerPage;
    const pageRequests = filteredRequests.slice(startIndex, endIndex);

    requestsTableBody.innerHTML = pageRequests.map(request => `
        <tr>
            <td>${request.id}</td>
            <td>${formatDate(request.date)}</td>
            <td>${request.name}</td>
            <td>${request.email}</td>
            <td>${formatMessenger(request.messenger)}</td>
            <td>${request.messengerUsername}</td>
            <td>${formatService(request.service)}</td>
            <td>${getStatusBadge(request.status)}</td>
            <td>
                <button class="admin-btn" onclick="openRequestModal(${request.id})">
                    Просмотр
                </button>
            </td>
        </tr>
    `).join('');
}

function filterRequests() {
    return state.requests.filter(request => {
        const matchesStatus = state.filters.status === 'all' || request.status === state.filters.status;
        const matchesType = state.filters.type === 'all' || request.service === state.filters.type;
        const matchesSearch = !state.filters.search || 
            request.name.toLowerCase().includes(state.filters.search.toLowerCase()) ||
            request.email.toLowerCase().includes(state.filters.search.toLowerCase()) ||
            request.messengerUsername.toLowerCase().includes(state.filters.search.toLowerCase()) ||
            request.message.toLowerCase().includes(state.filters.search.toLowerCase());
        
        return matchesStatus && matchesType && matchesSearch;
    });
}

// Функции пагинации
function updatePagination() {
    currentPageSpan.textContent = state.currentPage;
    prevPageBtn.disabled = state.currentPage === 1;
    nextPageBtn.disabled = state.currentPage === state.totalPages;
}

function changePage(page) {
    if (page >= 1 && page <= state.totalPages) {
        state.currentPage = page;
        updateTable();
        updatePagination();
    }
}

// Функции модального окна
async function openRequestModal(requestId) {
    const request = state.requests.find(r => r.id === requestId);
    if (!request) return;

    document.getElementById('modalName').textContent = request.name;
    document.getElementById('modalEmail').textContent = request.email;
    document.getElementById('modalMessenger').textContent = formatMessenger(request.messenger);
    document.getElementById('modalUsername').textContent = request.messengerUsername;
    document.getElementById('modalService').textContent = formatService(request.service);
    document.getElementById('modalMessage').textContent = request.message;
    document.getElementById('modalStatus').value = request.status;
    saveRequestBtn.dataset.requestId = requestId;

    requestModal.style.display = 'block';
}

function closeModal() {
    requestModal.style.display = 'none';
}

async function handleSaveRequest() {
    const requestId = saveRequestBtn.dataset.requestId;
    const newStatus = document.getElementById('modalStatus').value;

    try {
        const response = await fetch(`${config.apiUrl}/requests/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const updatedRequest = await response.json();
            state.requests = state.requests.map(r => 
                r.id === requestId ? updatedRequest : r
            );
            updateTable();
            closeModal();
        }
    } catch (error) {
        console.error('Ошибка обновления заявки:', error);
    }
}

// Вспомогательные функции
function formatDate(dateString) {
    return new Date(dateString).toLocaleString('ru-RU');
}

function getStatusBadge(status) {
    const statusMap = {
        new: { text: 'Новая', class: 'status-new' },
        in_progress: { text: 'В работе', class: 'status-in-progress' },
        completed: { text: 'Завершена', class: 'status-completed' }
    };
    
    const statusInfo = statusMap[status] || { text: status, class: '' };
    return `<span class="status-badge ${statusInfo.class}">${statusInfo.text}</span>`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function handleFilterChange() {
    state.filters = {
        status: statusFilter.value,
        type: typeFilter.value,
        search: searchInput.value
    };
    state.currentPage = 1;
    updateTable();
    updatePagination();
}

function formatMessenger(messenger) {
    const messengers = {
        'discord': 'Discord',
        'telegram': 'Telegram'
    };
    return messengers[messenger] || messenger;
}

function formatService(service) {
    const services = {
        'hosting': 'Хостинг сервера',
        'setup': 'Настройка сервера',
        'plugins': 'Установка плагинов',
        'other': 'Другое'
    };
    return services[service] || service;
} 