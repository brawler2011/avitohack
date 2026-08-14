# Avito Year in Review — Итоги Года на Авито

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=flat-square&logo=vite&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-1.0-000000?style=flat-square&logo=bun&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)
![Go](https://img.shields.io/badge/Go-1.25-00ADD8?style=flat-square&logo=go&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=flat-square&logo=docker&logoColor=white)
![Caddy](https://img.shields.io/badge/Caddy-2.0-025E8A?style=flat-square&logo=caddy&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=flat-square&logo=github-actions&logoColor=white)

**[omitendo.ru](https://omitendo.ru)** — интерактивный веб-сервис итогов года для пользователей Авито с персонализированными Stories-карточками, системами достижений (ачивок) и генерацией индивидуального рассказа и архетипа с помощью искусственного интеллекта (OpenRouter API / Gemini 2.0 Flash).

---

## Оглавление
- [Перечень используемых технологий](#перечень-используемых-технологий)
- [Структура проекта](#структура-проекта)
- [Инструкция по запуску](#инструкция-по-запуску)
  - [Быстрый запуск в Docker](#1-быстрый-запуск-в-docker)
  - [Локальная разработка](#2-локальная-разработка)
- [Распределение ответственности в команде](#распределение-ответственности-в-команде)

---

## Перечень используемых технологий

### **Frontend**
- **Framework & Tooling**: React 18 + TypeScript + Vite
- **Менеджер пакетов**: [Bun](https://bun.sh)
- **Стили и UI**: Tailwind CSS, PostCSS, Lucide React (иконки), Canvas-Confetti (эффекты)
- **Линтинг и качество кода**: ESLint v10, TypeScript-ESLint

### **Backend**
- **Язык и среда**: Go 1.25
- **HTTP Роутинг**: Chi Router (`github.com/go-chi/chi/v5`) + CORS Middleware
- **База данных**: PostgreSQL 16 + `pgx/v5`
- **Контракты API**: OpenAPI 3.0 (`contracts/openapi.yaml`) + `oapi-codegen`
- **ИИ-интеграция**: OpenRouter API (`google/gemini-2.0-flash-001`) для генерации рекапов
- **Тестирование и линтинг**: `golangci-lint`, `testing`, `testify`

### **DevOps & Инфраструктура**
- **Веб-сервер & Reverse Proxy**: Caddy (автоматический SSL/TLS, HTTP/2, gzip/zstd сжатие, проксирование `/api/v1` на Go backend и раздача SPA статикой)
- **Контейнеризация**: Docker, Docker Compose (мульти-контейнерный стек: DB, Backend, Frontend Builder, Caddy)
- **CI/CD Пайплайн**: GitHub Actions (`.github/workflows/deploy.yml`) — автоматическая проверка типов, линтинг бекенда и фронтенда, прогон юнит-тестов и автоматический деплой на VPS через SSH.

---

## Структура проекта

```
.
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD pipeline (Lint, Test, SSH Deploy)
├── backend/                    # Go REST API backend
│   ├── cmd/
│   │   └── server/             # Точка входа приложения (main.go)
│   ├── internal/
│   │   ├── config/             # Загрузка конфигурации из .env
│   │   ├── db/                 # Соединение с PostgreSQL
│   │   ├── domain/             # Сущности и модели данных
│   │   ├── repository/         # Запросы к БД
│   │   └── service/            # Бизнес-логика и LLM (OpenRouter) генератор
│   ├── pkg/
│   │   └── api/                # Сгенерированные OpenAPI структуры
│   ├── Dockerfile              # Dockerfile для сборки Go backend
│   ├── go.mod / go.sum         # Зависимости Go
│   └── sqlc.yaml               # Конфигурация SQLC
├── contracts/
│   ├── openapi.yaml            # Спецификация REST API (OpenAPI 3.0)
│   └── Makefile                # Скрипты генерации кода из контрактов
├── data/
│   ├── users.csv               # Сид-данные пользователей
│   └── user_activities.csv     # Сид-данные событий активности пользователей
├── frontend/                   # React + TypeScript + Vite + Bun SPA
│   ├── src/
│   │   ├── api/                # HTTP клиенты для обращения к REST API
│   │   ├── components/         # StoriesPlayer, AchievementsDashboard, Header, Modals
│   │   ├── App.tsx             # Главный компонент приложения
│   │   ├── main.tsx            # Точка входа React
│   │   └── index.css           # Tailwind CSS и пользовательские стили
│   ├── Dockerfile              # Dockerfile для сборки статичного бандла фронтенда
│   ├── package.json            # Скрипты и зависимости фронтенда (Bun)
│   ├── bun.lock                # Lock-файл Bun
│   ├── vite.config.ts          # Конфигурация Vite
│   ├── tailwind.config.js      # Конфигурация Tailwind CSS
│   └── eslint.config.js        # Конфигурация ESLint
├── migrations/
│   └── 001_init.sql            # Инициализация схемы таблиц PostgreSQL
├── Caddyfile                   # Конфигурация веб-сервера Caddy
├── docker-compose.yml          # Локальный Docker Compose стек
├── docker-compose.server.yml   # Production Docker Compose для сервера
├── .golangci.yaml              # Конфигурация линтера Go
├── .env.example                # Пример переменных окружения
└── README.md                   # Документация проекта
```

---

## Инструкция по запуску

### 1. Быстрый запуск в Docker

Перед запуском создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

#### Локальный запуск (Development):
```bash
docker compose up --build
```
После запуска приложения доступны адреса:
- **Frontend App**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`

#### Продакшен запуск на сервере (Production mode):
```bash
docker compose -f docker-compose.server.yml up -d --build
```
Обслуживает 80/443 порты с привязкой домена `omitendo.ru`.

---

### 2. Локальная разработка

Если необходимо запускать сервисы по отдельности:

#### Шаг 1: Запуск СУБД PostgreSQL
```bash
docker compose up postgres -d
```

#### Шаг 2: Запуск Backend (Go)
```bash
cd backend

# Запуск тестов
go test ./...

# Запуск круда
go run cmd/server/main.go
```

#### Шаг 3: Запуск Frontend (React + Bun)
> **Примечание**: используем **`bun`**!.

```bash
cd frontend

# Установка зависимостей
bun install

# Запуск сервера разработки Vite
bun run dev

# Запуск линтера и сборка
bun run lint
bun run build
```

---

## 🛠️ Панель Администратора и Интеграция ИИ (RabbitMQ & WebSockets)

В проекте реализована **крутая административная панель** для проверки и тестирования работы ИИ-генерации карточек и достижений:

- **Кнопка «Админка ИИ»** в шапке сайта переводит в интерфейс управления.
- **Очередь задач RabbitMQ**: При нажатии «Сгенерировать» / «Перегенерировать» таски с параметрами пользователя помещаются в очередь `recap_generation_queue`. Пул из 3 параллельных воркеров (горутин) на бекенде обрабатывает сообщения из RabbitMQ и обращается к OpenRouter API (`google/gemini-2.0-flash-001`).
- **Скрытие личных данных (PII Masking)**: Кнопка **«👁️ Превью PII»** показывает модальное окно с исходным профилем и анонимизированным промптом (`Алексей Смирнов` ➔ `[ПОЛЬЗОВАТЕЛЬ_#1]`), отправляемым в ИИ.
- **Мониторинг WebSockets**: В админке подключён WebSocket (`/api/v1/admin/ws`), транслирующий смену статусов задач (`QUEUED` 🟡 ➔ `PROCESSING` 🔵 ➔ `COMPLETED` 🟢) и live-логи воркеров в реальном времени.
- **Разделение сид-состояний**: На старте у пользователей `#1` и `#2` карточки уже сгенерированы (`🟢 Сгенерировано`), а у `#3`, `#4`, `#5` карточки отсутствуют (`⚪ Не сгенерировано`), что позволяет сразу затестить оба сценария.
- **Предупреждение по балансу API**: Вверху админки расположен баннер с предупреждением о лимитированном бюджете на OpenRouter.

---

## Распределение ответственности в команде

- @brawler2011 - бекенд, фронтенд, cicd, интеграция ИИ, генерация данных, настройка Docker/Docker Compose
- @kYrillkiRill - дизайн карточек и ачивок, крутые анимации
- @Onetooj - предоставил сервер для деплоя
- @nikoil - игнор с самого начала
