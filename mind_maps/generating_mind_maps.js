/*class MentalMapClient {
    constructor(baseUrl = 'http://127.0.0.1:8000') {
        this.baseUrl = baseUrl;
        this.checkInterval = 60000; // 1 минута
        this.maxWaitTime = 60 * 60 * 1000; // 1 час
        this.debugMode = true;
    }

    log(...args) {
        if (this.debugMode) {
            console.log('[MentalMap]', new Date().toISOString(), ...args);
        }
    }

    error(...args) {
        if (this.debugMode) {
            console.error('[MentalMap]', new Date().toISOString(), ...args);
        }
    }

    async generateMentalMap(text) {
        try {
            this.log('Starting mental map generation');
            this.updateStatus('Отправка запроса...');

            // Отправляем начальный запрос
            const response = await fetch(`${this.baseUrl}/mental_map_generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: text
                })
            });

            this.log('Initial response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                this.error('Server error response:', errorText);
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data = await response.json();
            this.log('Received task ID:', data.task_id);

            // Начинаем отслеживание статуса
            const result = await this.trackTaskProgress(data.task_id);

            // Получаем изображение
            if (result.status === 'completed') {
                await this.fetchAndDisplayImage();
            }

        } catch (error) {
            this.error('Error in generateMentalMap:', error);
            this.updateStatus(`Ошибка: ${error.message}`, true);
            throw error;
        }
    }

    async trackTaskProgress(taskId) {
        const startTime = Date.now();
        this.log('Starting task tracking for ID:', taskId);

        while (true) {
            try {
                // Проверяем таймаут
                if (Date.now() - startTime > this.maxWaitTime) {
                    throw new Error('Превышено время ожидания');
                }

                // Запрашиваем статус
                const response = await fetch(`${this.baseUrl}/mental_map_status/${taskId}`);
                this.log('Status response:', response.status);

                if (!response.ok) {
                    const errorText = await response.text();
                    this.error('Error checking status:', errorText);
                    throw new Error('Ошибка при проверке статуса');
                }

                const status = await response.json();
                this.log('Current status:', status);

                // Обновляем статус на странице
                this.updateStatus(status.message);

                // Проверяем завершение
                if (status.status === 'completed') {
                    this.log('Task completed successfully');
                    return status;
                }

                // Проверяем ошибки
                if (status.status === 'error') {
                    throw new Error(`Ошибка генерации: ${status.message}`);
                }

                // Ждем перед следующей проверкой
                await new Promise(resolve => setTimeout(resolve, this.checkInterval));

            } catch (error) {
                this.error('Error in trackTaskProgress:', error);
                throw error;
            }
        }
    }

    async fetchAndDisplayImage() {
        try {
            this.log('Fetching image');
            this.updateStatus('Загрузка изображения...');

            const response = await fetch(`${this.baseUrl}/mental_map_get/1_graph.png`);
            this.log('Image response status:', response.status);
            this.log('Image response headers: ', Object.fromEntries(response.headers));

            if (!response.ok) {
                const errorText = await response.text();
                this.error('Error fetching image:', errorText);
                throw new Error('Ошибка при загрузке изображения');
            }

            const blob = await response.blob();
            this.log('Received image blob:', {
                type: blob.type,
                size: blob.size
            });

            // Создаем URL и отображаем изображение
            const imageUrl = URL.createObjectURL(blob);
            this.log('Created image URL:', imageUrl);

            try {
                const imgElement = document.getElementById('generatedImage');
                if (!imgElement) {
                    throw new Error('Image element not found');
                }

                imgElement.onload = () => {
                    this.log('Image loaded successfully');
                    this.updateStatus('Карта готова!');
                    URL.revokeObjectURL(imageUrl);
                };

                imgElement.onerror = (error) => {
                    this.error('Error loading image:', error);
                    throw new Error('Ошибка загрузки изображения');
                };

                imgElement.src = imageUrl;
                imgElement.style.display = 'block';

            } catch (error) {
                URL.revokeObjectURL(imageUrl);
                throw error;
            }

        } catch (error) {
            this.error('Error in fetchAndDisplayImage:', error);
            this.updateStatus(`Ошибка: ${error.message}`, true);
            throw error;
        }
    }

    updateStatus(message, isError = false) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.style.color = isError ? 'red' : 'black';
        }
        this.log('Status updated:', message);
    }
}

// Использование:
const client = new MentalMapClient();

async function handleSubmit(text) {
    try {
        await client.generateMentalMap(text);
    } catch (error) {
        console.error('Error in handleSubmit:', error);
        alert(`Произошла ошибка: ${error.message}`);
    }
}*/