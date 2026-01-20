import bckg from "../assets/images/home-bckg.png";
import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function Home() {
    const navigate = useNavigate();
    
    const [mode, setMode] = useState("name"); 
    const [fieldValue, setFieldValue] = useState({
        fullName: "",
        rfzo: "",
    }); 

    const handleModeChange = (_event, value) => {
        if (value) setMode(value);

        setFieldValue({
            fullName: "",
            rfzo: "",
        });
    };

    const isValid = useMemo(() => {
        if (mode === "name") return fieldValue.fullName.trim().length > 0;
        return fieldValue.rfzo.trim().length > 0;
    }, [mode, fieldValue]);

    const handleContinue = (event) => {
        event.preventDefault();

        console.log("Continuing with:", mode, fieldValue);

        navigate( mode === "name" ? `/intern?name=${encodeURIComponent(fieldValue.fullName.trim())}`
                                 : `/admin?rfzo=${encodeURIComponent(fieldValue.rfzo.trim())}` );
    };

    return (
        <div className="page-container" style={{
        backgroundImage: `url(${bckg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        color: "white",
      }}>
            <div >
                <h1>HAHAI</h1>

                <Container maxWidth="sm" sx={{ py: 5, borderRadius: 3, }}>  {/*backgroundColor: "rgb(59 47 75 / 87%)",*/}
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3, }}>
                    <Stack spacing={3}>
                    <Typography variant="h5" fontWeight={700}> {/* sx={{ color: "white"}}> */}
                        Prijavite se
                    </Typography>

                    <ToggleButtonGroup
                        value={mode}
                        exclusive
                        onChange={handleModeChange}
                        fullWidth
                        aria-label="nacin-unosa"
                    >
                        <ToggleButton value="name" aria-label="internista">
                        Internista
                        </ToggleButton>
                        <ToggleButton value="rfzo" aria-label="specijalista">
                        Specijalista
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box component="form" onSubmit={handleContinue}>
                        <Stack spacing={2}>
                        
                        {mode === "name" ? (
                        <TextField
                            label="Ime i prezime"
                            value={fieldValue.fullName}
                            onChange={(e) => setFieldValue(prev => ({...prev, fullName: e.target.value}))}
                            disabled={mode !== "name"}
                            fullWidth
                            autoComplete="name"
                        />
                        ) : null}

                        {mode === "rfzo" ? (
                        <TextField
                            label="RFZO"
                            value={fieldValue.rfzo}
                            onChange={(e) => setFieldValue(prev => ({...prev, rfzo: e.target.value}))}
                            disabled={mode !== "rfzo"}
                            fullWidth
                            inputProps={{ inputMode: "numeric" }}
                        />
                        ) : null}

                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={!isValid}
                        >
                            Nastavi
                        </Button>
                        </Stack>
                    </Box>
                    </Stack>
                </Paper>
                </Container>
            </div>
        </div>
    );
}