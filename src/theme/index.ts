import { createTheme, type Shadows } from '@mui/material/styles'
import { FOCUS_RING_WIDTH, fonts, MIN_TOUCH_TARGET, tokens } from './tokens'

declare module '@mui/material/styles' {
  interface Palette {
    pizarra: { main: string; contrastText: string; muted: string }
    receives: Palette['primary']
  }
  interface PaletteOptions {
    pizarra?: { main: string; contrastText: string; muted: string }
    receives?: PaletteOptions['primary']
  }
}

const focusRing = (color: string) => ({
  outline: `${FOCUS_RING_WIDTH}px solid ${color}`,
  outlineOffset: 2,
})

const display = { fontFamily: fonts.display, fontWeight: 700 }

/** The single app theme: flat, bone paper, charcoal ink, ember actions (design D11). */
export const theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  palette: {
    mode: 'light',
    background: { default: tokens.bone, paper: tokens.bone },
    text: { primary: tokens.charcoal, secondary: tokens.charcoalSoft },
    primary: { main: tokens.ember, contrastText: tokens.onEmber },
    error: { main: tokens.error },
    divider: tokens.divider,
    pizarra: { main: tokens.pizarra, contrastText: tokens.chalk, muted: tokens.chalkMuted },
    receives: { main: tokens.chimichurri },
  },
  shape: { borderRadius: 4 },
  shadows: Array(25).fill('none') as Shadows,
  typography: {
    fontFamily: fonts.body,
    h1: { ...display, fontSize: '2rem', lineHeight: 1.15 },
    h2: { ...display, fontSize: '1.375rem', lineHeight: 1.25 },
    // Pizarra numerals: fluid size, no breakpoint jumps.
    h3: { ...display, fontSize: 'clamp(2.25rem, 10vw, 3rem)', lineHeight: 1.1 },
    button: { textTransform: 'none', fontWeight: 600, fontSize: '1rem' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { fontVariantNumeric: 'tabular-nums' },
        ':focus-visible': focusRing(tokens.ember),
      },
    },
    MuiButtonBase: {
      styleOverrides: { root: { '&.Mui-focusVisible': focusRing(tokens.ember) } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: MIN_TOUCH_TARGET, paddingInline: 20 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: MIN_TOUCH_TARGET, minHeight: MIN_TOUCH_TARGET } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: MIN_TOUCH_TARGET,
          backgroundColor: tokens.field,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.charcoalSoft },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.ember,
            borderWidth: FOCUS_RING_WIDTH,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { backgroundColor: tokens.boneSunken, color: tokens.charcoal },
        icon: { color: tokens.ember },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.pizarra,
          color: tokens.chalk,
          '& .MuiButtonBase-root': { color: tokens.chalk },
          '& .MuiButtonBase-root.Mui-focusVisible': focusRing(tokens.chalk),
        },
      },
    },
  },
})
