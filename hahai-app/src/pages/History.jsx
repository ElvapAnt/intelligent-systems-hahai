import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Chip,
    CircularProgress,
    Container,
    Divider,
    Paper,
    Stack,
    Typography,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@mui/material";
import { getInternToken, isAdminLoggedIn } from "../helpers/auth";
import bckg from "../assets/images/x-ray-bckg.jpg";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export default function History() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState("");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [recordToDelete, setRecordToDelete] = useState(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const empty = useMemo(() => !loading && !err && records.length === 0, [loading, err, records]);

    const API_BASE = "http://localhost:8000";

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                setLoading(true);
                setErr("");

                const adminLoggedIn = isAdminLoggedIn();     
                const internToken = getInternToken();        
                if (!adminLoggedIn && !internToken) {
                throw new Error("Niste prijavljeni.");
                }

                let url = "";
                let headers = {};

                if (adminLoggedIn) {
                    const rfzo = window.env?.RFZO_ADMIN;
                    
                    if (!rfzo) {
                        throw new Error("Nedostaje RFZO_ADMIN u window.env.");
                    }
                        url = `${API_BASE}/api/v1/records`;
                        headers = { "X-RFZO": rfzo };
                } else {
                    url = `${API_BASE}/api/v1/records/me`;
                    headers = { "X-Intern-Token": internToken };
                }

                const resp = await fetch(url, {
                method: "GET",
                headers,
                });

                if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || `Greška: ${resp.status}`);
                }

                const data = await resp.json();
                const list = Array.isArray(data) ? data : (data.items ?? data.records ?? []);
                if (!cancelled) setRecords(list);
            } catch (e) {
                if (!cancelled) setErr(e.message || String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
        cancelled = true;
        };
    }, []);   

    function formatAccuracy(val) {
        const n = Number(val);
        if (Number.isFinite(n)) return `${n.toFixed(1)}%`;
        return val ? `${val}%` : "";
    }

    const openDelete = (record) => {
        setRecordToDelete(record);
        setDeleteOpen(true);
    };
    const closeDelete = () => {
        setDeleteOpen(false);
        setRecordToDelete(null);
    };

    async function deleteRecord(case_id) {
        setDeleteSubmitting(true);
        try {
            await fetch(`http://localhost:8000/api/v1/records/${case_id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json",
                "X-RFZO": window.env.RFZO_ADMIN
                },
            });

            setRecords((prev) => prev.filter((s) => s.case_id !== case_id));
            setDeleteOpen(false);
            setRecordToDelete(null);
        } finally {
            setDeleteSubmitting(false);
        }
    }


    return (
         <div className="page-container" style={{
                         backgroundImage: `url(${bckg})`,
                         position: "relative",
                         backgroundSize: "cover",
                         backgroundPosition: "center",
                         overflowY: "auto",
                         color: "white",
                       }}>
        <Container maxWidth="lg" sx={{ marginTop: 1}}>
            <Stack spacing={2}>
            <Typography variant="h6" fontWeight={800}>
                Istorija slučajeva
            </Typography>

            {loading && (
                <Paper className="glass-card" sx={{ p: 3 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={22} />
                    <Typography>Učitavanje...</Typography>
                </Stack>
                </Paper>
            )}

            {err && (
                <Paper className="glass-card" sx={{ p: 3 }}>
                <Typography color="error">{err}</Typography>
                </Paper>
            )}

            {empty && (
                <Paper className="glass-card" sx={{ p: 3 }}>
                <Typography sx={{ opacity: 0.8 }}>
                    Još uvek nemate sačuvanih zapisa.
                </Typography>
                </Paper>
            )}

            {!loading &&
                !err &&
                records.map((r, idx) => {
                const xraySrc = `${API_BASE}${r.xray_url}`;
                const gradcamSrc = `${API_BASE}${r.gradcam_url}`;

                const label = r.pred_label ?? r.predLabel ?? "";
                const acc = r.pred_accuracy ?? r.predAccuracy ?? "";

                const notes = r.notes ?? "";

                return (
                    <Paper key={r.case_id ?? r.id ?? idx} className="glass-card" sx={{ p: 3, backgroundColor: "rgba(255,255,255,0.9)" }}>
                    
                    <Stack width={"100%"} alignItems={"end"}>
                    <Tooltip title="Obriši unos">
                            <IconButton onClick={() => openDelete(r)} color="error">
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                    </Stack>

                    <Stack spacing={2}>
                        <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={2}
                        alignItems={{ xs: "flex-start", md: "center" }}
                        justifyContent="space-evenly"
                        >
                        <Typography fontWeight={600}>
                            Slučaj: {r.case_id ?? r.id ?? `#${idx + 1}`}
                        </Typography>

                        {isAdminLoggedIn() && (
                            <Typography fontWeight={600}>
                            Student: {r.student_id ?? r.id ?? `#${idx + 1}`}
                            </Typography>
                        )}

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {label && <Chip label={`Predikcija: ${label}`} />}
                            {acc !== "" && <Chip label={`Tačnost: ${formatAccuracy(acc)}`} />}
                        </Stack>
                        </Stack>

                        <Divider sx={{ opacity: 0.2 }} />

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                        <Stack spacing={1} sx={{ flex: 1 }}>
                            <Typography fontWeight={700}>Original (X-ray)</Typography>
                            <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                borderColor: "rgba(255,255,255,0.22)",
                                overflow: "hidden",
                            }}
                            >
                            <Box
                                sx={{
                                height: { xs: 320, sm: 420, md: 520 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1,
                                }}
                            >
                                {xraySrc ? (
                                <img
                                    src={xraySrc}
                                    alt="xray"
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                                ) : (
                                <Typography sx={{ opacity: 0.7 }}>Nema slike</Typography>
                                )}
                            </Box>
                            </Paper>
                        </Stack>

                        <Stack spacing={1} sx={{ flex: 1 }}>
                            <Typography fontWeight={700}>Obrada (Grad-CAM)</Typography>
                            <Paper
                            variant="outlined"
                            sx={{
                                borderRadius: 2,
                                borderColor: "rgba(255,255,255,0.22)",
                                overflow: "hidden",
                            }}
                            >
                            <Box
                                sx={{
                                height: { xs: 320, sm: 420, md: 520 },
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 1,
                                }}
                            >
                                {gradcamSrc ? (
                                <img
                                    src={gradcamSrc}
                                    alt="gradcam"
                                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                />
                                ) : (
                                <Typography sx={{ opacity: 0.7 }}>Nema slike</Typography>
                                )}
                            </Box>
                            </Paper>
                        </Stack>
                        </Stack>

                        <Stack spacing={0.5}>
                        <Typography fontWeight={700}>Beleške</Typography>
                        <Typography sx={{ opacity: 0.85, whiteSpace: "pre-wrap" }}>
                            {notes || "—"}
                        </Typography>
                        </Stack>
                    </Stack>
                    </Paper>
                );
                })}
            </Stack>

            <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
            <DialogTitle>Obrisati unos?</DialogTitle>
            <DialogContent>
                <Typography>
                Da li ste sigurni da želite da obrišete unos{" "}
                <b>{recordToDelete?.case_id}</b>?
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={closeDelete} variant="outlined">Otkaži</Button>
                <Button
                onClick={() => deleteRecord(recordToDelete?.case_id)}
                variant="contained"
                color="error"
                disabled={!recordToDelete || deleteSubmitting}
                >
                Obriši
                </Button>
            </DialogActions>
            </Dialog>
        </Container>
        </div>
    );
}