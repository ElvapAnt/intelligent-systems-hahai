import {useState, useMemo, useEffect} from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import { getInternToken } from "../helpers/auth";
import bckg from "../assets/images/x-ray-bckg.jpg";

export default function Analysis() {
    const navigate = useNavigate();

    const [selectedFile, setSelectedFile] = useState(null);           
    const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState(""); 
    const [resultImageUrl, setResultImageUrl] = useState("");         
    const [resultInfo, setResultInfo] = useState({
        pred_label: "",
        pred_accuracy: ""
    });               

    const [isProcessing, setIsProcessing] = useState(false);          

    const [notes, setNotes] = useState("");                           
    const [leaveOpen, setLeaveOpen] = useState(false);
    const [tempId, setTempId] = useState(null);
    const [processedGradcamUrl, setProcessedGradcamUrl] = useState("");

    const API_BASE = "http://localhost:8000";

    async function fetchImageObjectUrl(url, token) {
        const resp = await fetch(url, {
            headers: { "X-Intern-Token": token },
        });
        if (!resp.ok) {
            const t = await resp.text();
            throw new Error(t || `Failed to load image: ${resp.status}`);
        }
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
    }

    useEffect(() => {
        return () => {
            if (resultImageUrl?.startsWith("blob:")) URL.revokeObjectURL(resultImageUrl);
        };
    }, [resultImageUrl]);

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
        setResultInfo({
            pred_label: "",
            pred_accuracy: ""
        });

        e.target.value = null;
        setTempId(null);
        setProcessedGradcamUrl("");
    };

    async function cancelTempIfExists(token) {
    if (!tempId) return;
        try {
            await fetch(`${API_BASE}/api/v1/process/${tempId}`, {
            method: "DELETE",
            headers: { "X-Intern-Token": token },
            });
        } catch {
            // ignore cleanup errors
        } finally {
            setTempId(null);
        }
    }

    async function handleProcess() {
        try {
            const token = getInternToken();
            if (!token) throw new Error("Niste prijavljeni kao internista.");
            if (!selectedFile) return;

            setIsProcessing(true);

            const fd = new FormData();
            fd.append("xray", selectedFile, selectedFile.name || "xray.jpg");

            const resp = await fetch(`${API_BASE}/api/v1/process`, {
            method: "POST",
            headers: { "X-Intern-Token": token },
            body: fd,
            });

            if (!resp.ok) {
            const msg = await resp.text();
            throw new Error(msg || `Processing failed: ${resp.status}`);
            }

            const data = await resp.json();
            setTempId(data.temp_id);
            setResultInfo({
            pred_label: data.pred_label,
            pred_accuracy: String(data.pred_accuracy),
            });

            const fullGradcam = `${API_BASE}${data.gradcam_url}`;
            setProcessedGradcamUrl(fullGradcam);

            const gradcamObjUrl = await fetchImageObjectUrl(fullGradcam, token);

            if (resultImageUrl?.startsWith("blob:")) URL.revokeObjectURL(resultImageUrl);
            setResultImageUrl(gradcamObjUrl);
        } catch (err) {
            console.error("Process failed:", err);
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleSave() {
        try {
            const token = getInternToken();
            if (!token) throw new Error("Niste prijavljeni kao internista.");
            if (!selectedFile) return;
            if (!processedGradcamUrl) throw new Error("Nema obrađene slike (gradcam) za čuvanje.");

            const fd = {
                temp_id: tempId || "",
                notes: notes ?? ""
            }
            const resp = await fetch(`${API_BASE}/api/v1/records`, {
            method: "POST",
            headers: { 
                "X-Intern-Token": token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(fd),
            });

            if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(errText || `Save failed: ${resp.status}`);
            }

            await cancelTempIfExists(token);

            navigate("/history");
        } catch (err) {
            console.error("Save failed:", err);
        }
    }        

    const handleOpenLeave = () => {
        setLeaveOpen(true);
    };

    const handleCloseLeave = () => {
        setLeaveOpen(false);
    };

    const handleConfirmLeave = async () => {
        try {
            const token = getInternToken();
            if (token) await cancelTempIfExists(token);
        } finally {
            setLeaveOpen(false);
            navigate("/");
        }
    };

    return (
        <div className="page-container" style={{
                backgroundImage: `url(${bckg})`,
                position: "relative",
                backgroundSize: "cover",
                backgroundPosition: "center",
                overflowY: "auto",
                color: "white",
              }}>
            <Container maxWidth="lg" style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                marginTop: "8px",}}>
                <Stack spacing={3}>
                <Stack spacing={2}>
                    <Typography variant="h6" fontWeight={800}>
                    Analiza slike
                    </Typography>

                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">                       
                    <Paper sx={{ p: 2, flex: 1, display:"flex", justifyContent: "center" }}>
                    <Stack spacing={2} width="100%">
                        <Typography fontWeight={700}>Original</Typography>

                        <Paper variant="outlined">
                        <Box
                            sx={{
                            height: { xs: 320, sm: 420, md: 520 },
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
                            <Button variant="outlined" component="label" 
                                disabled={isProcessing}>
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
                        </Stack>
                    </Stack>
                    </Paper>
                    
                    <Paper sx={{ p: 2, flex: 1, display:"flex", justifyContent: "center" }}>
                    <Stack spacing={2} width="100%">
                        <Typography fontWeight={700}>Rezultat</Typography>

                        <Paper variant="outlined">
                        <Box
                            sx={{
                            height: { xs: 320, sm: 420, md: 520 },
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
                            ) : isProcessing ? (
                                <Box>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    Obrada u toku...
                                </Typography>
                                <LinearProgress />
                                </Box> 
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

                        {resultInfo.pred_accuracy ? (
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>                            
                            {"Predikcija: " + resultInfo.pred_label + " sa sigurnošću od " + Number(resultInfo.pred_accuracy).toFixed(2) + "%"}
                            </Typography>
                        ) : (
                            <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            Informacije će se prikazati nakon obrade.
                            </Typography>
                        )}
                    </Stack>
                    </Paper>
                    </Stack>
                
                </Stack>
                <Stack spacing={2} marginTop={0} paddingBottom={"16px"} sx={{
                    backgroundColor: "white",
                    color: "black",
                    padding: 1,
                    }}>
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
                        <Button variant="outlined" disabled={!selectedFile && !notes} onClick={handleOpenLeave}>
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
                        <Button variant="outlined" onClick={handleCloseLeave}>Otkaži</Button>
                        <Button color="error" variant="contained" onClick={handleConfirmLeave}>
                            Napusti
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
            
        </div>
    );
}