import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './lib/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import SpacesPage from './pages/SpacesPage'
import SpaceFormPage from './pages/SpaceFormPage'
import SpaceDetailPage from './pages/SpaceDetailPage'
import ItemDetailPage from './pages/ItemDetailPage'
import ItemFormPage from './pages/ItemFormPage'
import QuickAddItemPage from './pages/QuickAddItemPage'
import PaletteFormPage from './pages/PaletteFormPage'
import LightingDetailPage from './pages/LightingDetailPage'
import LightingFormPage from './pages/LightingFormPage'
import RenderDetailPage from './pages/RenderDetailPage'
import AIStudioPage from './pages/AIStudioPage'
import RendersPage from './pages/RendersPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SpacesPage />} />
            <Route path="spaces/new" element={<SpaceFormPage />} />
            <Route path="spaces/:id" element={<SpaceDetailPage />} />
            <Route path="spaces/:id/edit" element={<SpaceFormPage />} />
            <Route path="spaces/:id/items/new" element={<ItemFormPage />} />
            <Route path="spaces/:id/items/quick-add" element={<QuickAddItemPage />} />
            <Route path="spaces/:id/items/:itemId" element={<ItemDetailPage />} />
            <Route path="spaces/:id/items/:itemId/edit" element={<ItemFormPage />} />
            <Route path="spaces/:id/palettes/new" element={<PaletteFormPage />} />
            <Route path="spaces/:id/palettes/:paletteId" element={<PaletteFormPage />} />
            <Route path="spaces/:id/lighting/new" element={<LightingFormPage />} />
            <Route path="spaces/:id/lighting/:lightingId" element={<LightingDetailPage />} />
            <Route path="spaces/:id/lighting/:lightingId/edit" element={<LightingFormPage />} />
            <Route path="spaces/:id/renders/:renderId" element={<RenderDetailPage />} />
            <Route path="ai-studio" element={<AIStudioPage />} />
            <Route path="renders" element={<RendersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
