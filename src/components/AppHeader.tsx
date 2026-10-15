import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function AppHeader() {
  return (
    <Box component="header" sx={{ pt: { xs: 4, sm: 6 }, pb: 3 }}>
      <Typography variant="h1">AsadoSplit</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Anotá cuánto puso cada uno y te decimos quién le transfiere a quién.
      </Typography>
    </Box>
  )
}
