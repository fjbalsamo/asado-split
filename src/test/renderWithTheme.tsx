import { ThemeProvider } from '@mui/material/styles'
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { theme } from '../theme'

export function renderWithTheme(ui: ReactElement, options?: RenderOptions) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>, options)
}
