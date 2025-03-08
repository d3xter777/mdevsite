// Цены для разных типов услуг
const prices = {
    web: {
        landing: { simple: 500, medium: 800, complex: 1200 },
        corporate: { simple: 1000, medium: 1500, complex: 2000 },
        ecommerce: { simple: 2000, medium: 3000, complex: 4000 }
    },
    server: {
        basic: { simple: 300, medium: 500, complex: 800 },
        modded: { simple: 600, medium: 1000, complex: 1500 },
        custom: { simple: 1000, medium: 2000, complex: 3000 }
    },
    game: {
        minigames: { simple: 400, medium: 800, complex: 1200 },
        mods: { simple: 800, medium: 1500, complex: 2500 },
        plugins: { simple: 500, medium: 1000, complex: 1500 }
    }
};

// Опции для каждого типа услуги
const serviceOptions = {
    web: [
        { value: 'landing', text: 'Лендинг' },
        { value: 'corporate', text: 'Корпоративный сайт' },
        { value: 'ecommerce', text: 'Интернет-магазин' }
    ],
    server: [
        { value: 'basic', text: 'Базовый сервер' },
        { value: 'modded', text: 'Модный сервер' },
        { value: 'custom', text: 'Кастомный сервер' }
    ],
    game: [
        { value: 'minigames', text: 'Мини-игры' },
        { value: 'mods', text: 'Моды' },
        { value: 'plugins', text: 'Плагины' }
    ]
};

// Множители для сроков
const deadlineMultipliers = {
    fast: 1.5,
    normal: 1,
    long: 0.8
};

// Инициализация калькулятора
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('calculatorModal');
    const serviceType = document.getElementById('serviceType');
    const serviceOption = document.getElementById('serviceOption');
    const complexity = document.getElementById('complexity');
    const deadline = document.getElementById('deadline');
    const priceDisplay = document.querySelector('.price');
    const calculateButtons = document.querySelectorAll('.calculate-btn');

    // Обработчик клика по кнопкам расчета
    calculateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const serviceCard = this.closest('.service-card');
            const service = serviceCard.dataset.service;
            serviceType.value = service;
            updateServiceOptions(service);
            modal.style.display = 'block';
            calculatePrice();
        });
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Обновление опций при изменении типа услуги
    serviceType.addEventListener('change', function() {
        updateServiceOptions(this.value);
        calculatePrice();
    });

    // Пересчет цены при изменении параметров
    [complexity, deadline].forEach(select => {
        select.addEventListener('change', calculatePrice);
    });

    // Функция обновления опций услуги
    function updateServiceOptions(service) {
        serviceOption.innerHTML = '';
        serviceOptions[service].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.text;
            serviceOption.appendChild(optionElement);
        });
    }

    // Функция расчета цены
    function calculatePrice() {
        const service = serviceType.value;
        const option = serviceOption.value;
        const complexityValue = complexity.value;
        const deadlineValue = deadline.value;

        const basePrice = prices[service][option][complexityValue];
        const finalPrice = Math.round(basePrice * deadlineMultipliers[deadlineValue]);

        priceDisplay.textContent = `${finalPrice} ₽`;
    }
}); 