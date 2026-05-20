import React, { useState } from 'react';
import './App.css';

function App() {
  // Состояние для хранения файла картинки (для отправки на сервер)
  const [imageFile, setImageFile] = useState(null);
  
  // Состояние для ссылки на картинку (чтобы показать превью на экране)
  const [imagePreview, setImagePreview] = useState(null);
  
  // Состояние для хранения результатов (массив цветов)
  const [colors, setColors] = useState([]);
  
  // Состояние загрузки (true — когда ждем ответ, false — когда не ждем)
  const [isLoading, setIsLoading] = useState(false);
  
  // Состояние для ошибок (если сервер упадет или файл будет не тот)
  const [error, setError] = useState(null);

  // Функция, которая срабатывает, когда пользователь выбирает файл на компьютере
  const handleFileChange = (event) => {
    const file = event.target.files[0]; // Берем первый выбранный файл
    
    if (file) {
      setImageFile(file); // Сохраняем сам файл для будущего запроса к бэку
      setError(null);     // Сбрасываем прошлые ошибки, если они были

      // Создаем локальную ссылку на файл, чтобы React мог отобразить его как картинку
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); // Записываем ссылку в состояние превью
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция имитации отправки данных на сервер (наш Mock-запрос)
  const handleAnalyzeClick = () => {
    if (!imageFile) {
      setError('Пожалуйста, сначала выберите изображение!');
      return;
    }

    setIsLoading(true); // Включаем режим загрузки (на экране появится "Анализируем...")
    setError(null);     // Очищаем ошибки перед новым запросом
    setColors([]);      // Очищаем прошлые результаты

    // Имитируем задержку сети в 2 секунды
    setTimeout(() => {
      // Это фейковый ответ сервера. Завтра мы заменим этот блок на fetch к бэкенду
      const mockResponse = [
        { id: 1, hex: '#1E293B', name: 'Глубокий шиферный' },
        { id: 2, hex: '#3B82F6', name: 'Яркий синий' },
        { id: 3, hex: '#10B981', name: 'Изумрудный' },
        { id: 4, hex: '#F59E0B', name: 'Янтарный' }
      ];

      setColors(mockResponse); // Сохраняем цвета
      setIsLoading(false);     // Выключаем режим загрузки
    }, 2000);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>ColorFinder AI <span>🎨</span></h1>
        <p>Загрузите изображение, и наш ИИ определит его палитру</p>
      </header>

      <main className="app-content">
        {/* Кнопка выбора файла замаскирована под красивую зону */}
        <div className="upload-section">
          <input 
            type="file" 
            accept="image/*" 
            id="file-input" 
            onChange={handleFileChange} 
            className="hidden-input"
          />
          <label htmlFor="file-input" className="upload-label">
            {imagePreview ? 'Выбрать другую картинку' : 'Выбрать картинку на ПК'}
          </label>
        </div>

        {/* Условие UX: Если картинка выбрана — показываем её превью */}
        {imagePreview && (
          <div className="preview-container">
            <img src={imagePreview} alt="Превью" className="image-preview" />
          </div>
        )}

        {/* Кнопка запуска анализа */}
        <button 
          onClick={handleAnalyzeClick} 
          disabled={isLoading} 
          className="analyze-button"
        >
          {isLoading ? 'ИИ анализирует пиксели...' : 'Найти главные цвета'}
        </button>

        {/* Условие UX: Если есть ошибка — выводим её красным текстом */}
        {error && <div className="error-message">{error}</div>}

        {/* Условие UX: Если идет загрузка — показываем простенький спиннер */}
        {isLoading && <div className="loader">Загрузка...</div>}

        {/* Зона вывода результатов */}
        {colors.length > 0 && (
          <div className="results-container">
            <h3>Найденная палитра:</h3>
            <div className="palette-grid">
              {colors.map((color) => (
                <div key={color.id} className="color-card">
                  <div 
                    className="color-box" 
                    style={{ backgroundColor: color.hex }} 
                  />
                  <div className="color-info">
                    <span className="color-hex">{color.hex}</span>
                    <span className="color-name">{color.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;