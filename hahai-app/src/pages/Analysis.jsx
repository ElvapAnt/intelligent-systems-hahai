import {useState, useMemo, useEffect} from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Divider,
} from "@mui/material";

export default function Analysis() {
    
    const [selectedFile, setSelectedFile] = useState(null);           
    const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(""); 
    const [resultImageUrl, setResultImageUrl] = useState("");         
    const [resultInfo, setResultInfo] = useState(null);               

    const [isProcessing, setIsProcessing] = useState(false);          
    const [progress, setProgress] = useState(0);                      

    const [notes, setNotes] = useState("");                           
    const [leaveOpen, setLeaveOpen] = useState(false);

    useEffect(() => {
        return () => {
            if (uploadedPreviewUrl) URL.revokeObjectURL(uploadedPreviewUrl);
        };
    }, [uploadedPreviewUrl]);

    const canProcess = useMemo(() => !!selectedFile && !isProcessing, [selectedFile, isProcessing]);
    const canSave = useMemo(
        () => !!selectedFile && !!resultImageUrl && !isProcessing,
        [selectedFile, resultImageUrl, isProcessing]
    );

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (uploadedPreviewUrl) {
            URL.revokeObjectURL(uploadedPreviewUrl);
        }

        const previewUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setUploadedPreviewUrl(previewUrl);

        setResultImageUrl("");
        setResultInfo(null);

        e.target.value = null;
    };

    async function handleProcess() {
    // TODO: setIsProcessing(true), setProgress(...), call backend, setResultImageUrl, setResultInfo, finally setIsProcessing(false)
    }

    async function handleSave() {
    // TODO: call backend save endpoint
    }

    const handleOpenLeave = () => {
        setLeaveOpen(true);
    };

    const handleCloseLeave = () => {
        setLeaveOpen(false);
    };

    const handleConfirmLeave = () => {
        setLeaveOpen(false);
        
        //navigate 
    };

    return (
        <div className="page-container">
            <Container maxWidth="lg" style={{height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",}}>
                <Stack spacing={3}>
                    <Stack spacing={2}>
                        <Typography variant="h6" fontWeight={800}>
                        Analiza slike
                        </Typography>

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">                       
                            <Paper sx={{ p: 2, flex: 1, display:"flex", justifyContent: "center" }}>
                                <Stack spacing={2} width="fit-content">
                                    <Typography fontWeight={700}>Original</Typography>

                                    <Paper variant="outlined">
                                    <Box
                                        sx={{
                                        height: 300,
                                        borderRadius: 2,
                                        border: "1px dashed rgba(255,255,255,0.22)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        }}
                                    >
                                        {uploadedPreviewUrl ? (
                                        <img
                                            src={uploadedPreviewUrl}
                                            alt="Uploaded preview"
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                        ) : (
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                            Nema slike
                                        </Typography>
                                        )}
                                    </Box>
                                    </Paper>
                                    <Stack spacing={1.5}>
                                        <Button variant="outlined" component="label">
                                            Odaberi sliku
                                            <input
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={handleFileChange}
                                            />
                                        </Button>

                                        <Button
                                            variant="contained"
                                            disabled={!canProcess}
                                            onClick={handleProcess}
                                        >
                                            Procesiraj
                                        </Button>

                                        {isProcessing && (
                                            <Box>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                Obrada u toku...
                                            </Typography>
                                            <LinearProgress />
                                            </Box>
                                        )}
                                    </Stack>
                                </Stack>
                            </Paper>
                            

                            <Paper sx={{ p: 2, flex: 1, display:"flex", justifyContent: "center" }}>
                                <Stack spacing={2} width="fit-content">
                                    <Typography fontWeight={700}>Rezultat</Typography>

                                    <Paper variant="outlined">
                                    <Box
                                        sx={{
                                        height: 300,
                                        borderRadius: 2,
                                        border: "1px dashed rgba(255,255,255,0.22)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        overflow: "hidden",
                                        }}
                                    >
                                        {resultImageUrl ? (
                                        <img
                                            src={resultImageUrl}
                                            alt="Result preview"
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                        />
                                        ) : (
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                            Još nema rezultata
                                        </Typography>
                                        )}
                                    </Box>
                                    </Paper>
                                    
                                    <Typography fontWeight={700} sx={{ mb: 1 }}>
                                    Informacije
                                    </Typography>

                                    {resultInfo ? (
                                        <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                                        {JSON.stringify(resultInfo, null, 2)}
                                        </pre>
                                    ) : (
                                        <Typography variant="body2" sx={{ opacity: 0.7 }}>
                                        Informacije će se prikazati nakon obrade.
                                        </Typography>
                                    )}
                                </Stack>
                            </Paper>
                        </Stack>
                    
                    </Stack>
                    <Stack spacing={2} marginTop={0}>
                        <Typography variant="h6" fontWeight={800}>
                        Beleške
                        </Typography>

                        <TextField
                        label="Unesite tekst"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        fullWidth
                        multiline
                        minRows={6}
                        />

                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button variant="outlined" onClick={handleOpenLeave}>
                                Napusti
                            </Button>

                            <Button variant="contained" disabled={!canSave} onClick={handleSave}>
                                Sačuvaj
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>

                <Dialog open={leaveOpen} onClose={handleCloseLeave}>
                    <DialogTitle>Napustiti stranicu?</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Imate nesačuvane izmene. Ako napustite stranicu, podaci mogu biti izgubljeni.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseLeave}>Otkaži</Button>
                        <Button color="error" variant="contained" onClick={handleConfirmLeave}>
                            Napusti
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
            
        </div>
    );
}