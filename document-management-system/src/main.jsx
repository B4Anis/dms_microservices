import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { DocumentProvider } from './contexts/DocumentContext'
import { CommentsProvider } from './contexts/CommentsContext'
import { UserProvider } from './contexts/UserContext'
import { LoadingProvider } from './contexts/LoadingContext'
import ErrorBoundary from './components/common/ErrorBoundary'
import Toast from './components/common/Toast'
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <LoadingProvider>
            <AuthProvider>
              <UserProvider>
                <DocumentProvider>
                  <CommentsProvider>
                    <App />
                    <Toast />
                  </CommentsProvider>
                </DocumentProvider>
              </UserProvider>
            </AuthProvider>
          </LoadingProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
