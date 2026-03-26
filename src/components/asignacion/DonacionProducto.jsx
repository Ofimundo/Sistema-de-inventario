import React, { useState } from 'react';
import {
    Grid,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Autocomplete
} from '@mui/material';
import { Save as SaveIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import asignacionService from '../../services/asignacionService';

const validationSchema = Yup.object({
    producto_id: Yup.number().required('Debe seleccionar un producto'),
    beneficiario: Yup.string().required('El nombre del beneficiario es requerido'),
    rut_beneficiario: Yup.string().required('El RUT del beneficiario es requerido'),
    direccion: Yup.string().required('La dirección es requerida'),
    comuna: Yup.string().required('La comuna es requerida'),
    ciudad: Yup.string().required('La ciudad es requerida'),
    fecha_entrega: Yup.date().required('La fecha de entrega es requerida')
});

export default function DonacionProducto({ productos, loading, onSuccess, onError }) {
    const [submitting, setSubmitting] = useState(false);
    const [archivo, setArchivo] = useState(null);

    const formik = useFormik({
        initialValues: {
            producto_id: '',
            beneficiario: '',
            rut_beneficiario: '',
            direccion: '',
            comuna: '',
            ciudad: '',
            fecha_entrega: new Date().toISOString().split('T')[0],
            observaciones: ''
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                setSubmitting(true);
                const formData = {
                    ...values,
                    documento: archivo
                };
                await asignacionService.registrarDonacion(formData);
                formik.resetForm();
                setArchivo(null);
                onSuccess();
            } catch (error) {
                onError(error.message || 'Error al registrar donación');
            } finally {
                setSubmitting(false);
            }
        }
    });

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setArchivo(file);
        }
    };

    return (
        <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                        Registrar Donación
                    </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                        <Autocomplete
                            options={productos}
                            loading={loading}
                            getOptionLabel={(option) => 
                                `${option.nombre} - ${option.marca} ${option.modelo} (Stock: ${option.stock})`
                            }
                            onChange={(event, value) => {
                                formik.setFieldValue('producto_id', value?.id || '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Seleccionar Producto"
                                    error={formik.touched.producto_id && Boolean(formik.errors.producto_id)}
                                    helperText={formik.touched.producto_id && formik.errors.producto_id}
                                />
                            )}
                        />
                    </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="beneficiario"
                        label="Nombre del Beneficiario"
                        value={formik.values.beneficiario}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.beneficiario && Boolean(formik.errors.beneficiario)}
                        helperText={formik.touched.beneficiario && formik.errors.beneficiario}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="rut_beneficiario"
                        label="RUT del Beneficiario"
                        value={formik.values.rut_beneficiario}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.rut_beneficiario && Boolean(formik.errors.rut_beneficiario)}
                        helperText={formik.touched.rut_beneficiario && formik.errors.rut_beneficiario}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        type="date"
                        name="fecha_entrega"
                        label="Fecha de Entrega"
                        value={formik.values.fecha_entrega}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        InputLabelProps={{ shrink: true }}
                        error={formik.touched.fecha_entrega && Boolean(formik.errors.fecha_entrega)}
                        helperText={formik.touched.fecha_entrega && formik.errors.fecha_entrega}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="direccion"
                        label="Dirección"
                        value={formik.values.direccion}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.direccion && Boolean(formik.errors.direccion)}
                        helperText={formik.touched.direccion && formik.errors.direccion}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="comuna"
                        label="Comuna"
                        value={formik.values.comuna}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.comuna && Boolean(formik.errors.comuna)}
                        helperText={formik.touched.comuna && formik.errors.comuna}
                    />
                </Grid>

                <Grid item xs={12} md={6}>
                    <TextField
                        fullWidth
                        name="ciudad"
                        label="Ciudad"
                        value={formik.values.ciudad}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.ciudad && Boolean(formik.errors.ciudad)}
                        helperText={formik.touched.ciudad && formik.errors.ciudad}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadIcon />}
                        sx={{ mb: 2 }}
                    >
                        {archivo ? archivo.name : 'Subir documento firmado'}
                        <input
                            type="file"
                            hidden
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                        />
                    </Button>
                    {archivo && (
                        <Typography variant="caption" display="block" gutterBottom>
                            Archivo seleccionado: {archivo.name}
                        </Typography>
                    )}
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        name="observaciones"
                        label="Observaciones"
                        value={formik.values.observaciones}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                    />
                </Grid>

                <Grid item xs={12}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={<SaveIcon />}
                        disabled={submitting || !formik.isValid}
                        sx={{ mt: 2 }}
                    >
                        {submitting ? 'Registrando...' : 'Registrar Donación'}
                    </Button>
                </Grid>
            </Grid>
        </form>
    );
}