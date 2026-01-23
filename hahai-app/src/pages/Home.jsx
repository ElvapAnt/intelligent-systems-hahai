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
import { getInternToken, setInternToken } from "../helpers/auth";

export default function Home() {
    const navigate = useNavigate();
    const token = getInternToken();
        
    const [mode, setMode] = useState("index"); 
    const [fieldValue, setFieldValue] = useState({
        indexNumber: "",
        rfzo: "",
    }); 
    const [errorMessage, setErrorMessage] = useState("");

    const handleModeChange = (_event, value) => {
        if (value) setMode(value);

        setFieldValue({
            indexNumber: "",
            rfzo: "",
        });
    };

    const isValid = useMemo(() => {
        if (mode === "index") return fieldValue.indexNumber.trim().length > 0;
        return fieldValue.rfzo.trim().length > 0;
    }, [mode, fieldValue]);

    async function handleContinue (event) {
        event.preventDefault();

        if (mode === "index") {
            const resp = await fetch("http://localhost:8000/api/v1/auth/intern/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ student_id: fieldValue.indexNumber.trim() }),
            });

            if (!resp.ok) {
                setErrorMessage("Neuspešna prijava interniste: Nepostojeći broj indeksa.");
                return;
            }

            const data = await resp.json();
            
            setInternToken(data.token);
            navigate('/analysis');

            return;
        }

        navigate( mode === "index" ? `/analysis?index=${encodeURIComponent(fieldValue.indexNumber.trim())}`
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
                        <ToggleButton value="index" aria-label="internista">
                        Internista
                        </ToggleButton>
                        <ToggleButton value="rfzo" aria-label="specijalista">
                        Specijalista
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <Box component="form" onSubmit={handleContinue}>
                        <Stack spacing={2}>
                        
                        {mode === "index" ? (
                        <TextField
                            label="Broj indeksa"
                            value={fieldValue.indexNumber}
                            onChange={(e) => setFieldValue(prev => ({...prev, indexNumber: e.target.value}))}
                            disabled={mode !== "index"}
                            fullWidth
                            autoComplete="index"
                        />
                        ) : null}

                        {mode === "rfzo" ? (
                        <TextField
                            label="RFZO"
                            value={fieldValue.rfzo}
                            onChange={(e) => setFieldValue(prev => ({...prev, rfzo: e.target.value}))}
                            disabled={mode !== "rfzo"}
                            fullWidth
                        />
                        ) : null}

                        {errorMessage && (
                            <Typography color="error">{errorMessage}</Typography>
                        )}

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