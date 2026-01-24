import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import bckg from "../assets/images/x-ray-bckg.jpg";
import { isAdminLoggedIn } from "../helpers/auth";

export default function Admin() {
  const [students, setStudents] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [query, setQuery] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => String(s.student_id).toLowerCase().includes(q));
  }, [students, query]);

  const canAdd = useMemo(() => newStudentId.trim().length > 0 && !addSubmitting, [newStudentId, addSubmitting]);
  
  async function fetchStudents() {
    setLoading(true);
    setErr("");
    const isAdmin = isAdminLoggedIn();
    try {
      const resp = await fetch("http://localhost:8000/api/v1/interns", {
        method: "GET",
        headers: { "Content-Type": "application/json",
            "X-RFZO": isAdmin ? window.env.RFZO_ADMIN : ""
         },
      });

        if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg || `Greška: ${resp.status}`);
        }

        const data = await resp.json();
        const list = Array.isArray(data) ? data : (data.items ?? data.interns ?? []);
        setStudents(list);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  async function addStudent(student_id) {
    setAddSubmitting(true);
    try {
      const id = student_id.trim();
      const name = newStudentName.split(' ')[0] || '';
      const surname = newStudentName.split(' ')[1] || '';

      if (students.some((s) => s.student_id === id)) {
        throw new Error("Student već postoji.");
      }

      await fetch("http://localhost:8000/api/v1/interns", {
        method: "POST",
        headers: { "Content-Type": "application/json",
            "X-RFZO": window.env.RFZO_ADMIN
        },
        body: JSON.stringify({ 
            student_id: id,
            name: name,
            surname: surname
         }),
      });

      setStudents((prev) => [{ student_id: id }, ...prev]);
      setAddOpen(false);
      setNewStudentId("");
    } finally {
      setAddSubmitting(false);
    }
  }

  async function deleteStudent(student_id) {
    // TODO: DELETE /api/v1/admin/students/{student_id}
    setDeleteSubmitting(true);
    try {
        await fetch(`http://localhost:8000/api/v1/interns/${student_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json",
            "X-RFZO": window.env.RFZO_ADMIN
         },
        });

        setStudents((prev) => prev.filter((s) => s.student_id !== student_id));
        setDeleteOpen(false);
        setStudentToDelete(null);
    } finally {
        setDeleteSubmitting(false);
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  const openAdd = () => setAddOpen(true);
  const closeAdd = () => {
    setAddOpen(false);
    setNewStudentId("");
  };

  const openDelete = (student) => {
    setStudentToDelete(student);
    setDeleteOpen(true);
  };
  const closeDelete = () => {
    setDeleteOpen(false);
    setStudentToDelete(null);
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
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={2}>
            <Typography variant="h6" fontWeight={800}>
              Admin — Studenti
            </Typography>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchStudents} disabled={loading}>
                Osveži
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
                Dodaj studenta
              </Button>
            </Stack>
          </Stack>

          <Paper className="glass-card" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Pretraga (broj indeksa)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                fullWidth
              />

              {err && (
                <Typography color="error">
                  {err}
                </Typography>
              )}

              <Paper variant="outlined" sx={{ overflowX: "auto" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><b>Indeks studenta</b></TableCell>
                      <TableCell><b>Ime i prezime</b></TableCell>
                      <TableCell><b>Broj slučajeva</b></TableCell>
                      <TableCell align="right"><b>Akcije</b></TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filtered.map((s) => (
                      <TableRow key={s.student_id} hover>
                        <TableCell>{s.student_id}</TableCell>
                        <TableCell>{s.name + " " + s.surname}</TableCell>
                        <TableCell>{Array.isArray(s.patient_records) ? s.patient_records.length : 0}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Obriši studenta">
                            <IconButton onClick={() => openDelete(s)} color="error">
                              <DeleteOutlineIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}

                    {!loading && filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography sx={{ opacity: 0.75 }}>
                            Nema rezultata.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                    {loading && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography sx={{ opacity: 0.75 }}>
                            Učitavanje...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Stack>
          </Paper>
        </Stack>

        <Dialog open={addOpen} onClose={closeAdd} fullWidth maxWidth="xs">
          <DialogTitle>Dodaj studenta</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Broj indeksa"
                value={newStudentId}
                onChange={(e) => setNewStudentId(e.target.value)}
                autoFocus
                fullWidth
              />
              <TextField
                label="Ime i prezime"
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                autoFocus
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeAdd} variant="outlined">Otkaži</Button>
            <Button
              onClick={() => addStudent(newStudentId)}
              variant="contained"
              disabled={!canAdd}
            >
              Dodaj
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteOpen} onClose={closeDelete} fullWidth maxWidth="xs">
          <DialogTitle>Obrisati studenta?</DialogTitle>
          <DialogContent>
            <Typography>
              Da li ste sigurni da želite da obrišete studenta{" "}
              <b>{studentToDelete?.student_id}</b>?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDelete} variant="outlined">Otkaži</Button>
            <Button
              onClick={() => deleteStudent(studentToDelete?.student_id)}
              variant="contained"
              color="error"
              disabled={!studentToDelete || deleteSubmitting}
            >
              Obriši
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </div>
  );
}
