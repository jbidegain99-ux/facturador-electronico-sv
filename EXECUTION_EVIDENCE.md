# Execution Evidence: Wellnest Facturas Marzo 2026

## Summary
- **Tenant:** The Wellnest (ID: cmlrggeh6000c5uj5byzwyhyh)
- **Rango:** 2026-03-01 → 2026-03-31
- **Total DTEs encontrados:** 107
- **PDFs generados:** 107 / 107
- **PDFs fallidos:** 0
- **Excel rows:** 107
- **ZIP size:** 2.78 MB
- **Total facturado marzo:** $5097.72

## Deliverables
- ✅ wellnest_facturas_marzo2026.zip (107 PDFs)
- ✅ wellnest_facturas_marzo2026.xlsx (107 rows + TOTAL)

## Sample Data (first 5 rows)
| Cliente | Email | Doc | Concepto | Monto | Fecha |
|---------|-------|-----|----------|-------|-------|
| Paola Nicole Alvarado Erazo | paolaalvarado727@gmail.com | AUTO-1772496690829-jmjmrg | Paquete de 4 clases - Wellnest Studio | $42.49 | 2026-03-03 |
| Alessandra Esquivel | aleesquivel260199@gmail.com | AUTO-1772496814590-xttule | Paquete de 12 clases - Wellnest Studio | $80.75 | 2026-03-03 |
| Sofía Merino | sofiamerinoo@hotmail.com | AUTO-1772496914408-c6fcp1 | Paquete de 5 clases - Wellnest Studio | $65.00 | 2026-03-03 |
| Karla Beatriz Morales Alfaro | kbea.morales@gmail.com | AUTO-1772496961211-n9q5bx | Paquete de 4 clases - Wellnest Studio | $42.49 | 2026-03-03 |
| Katerine Dayana Rodríguez Portillo | katerine.portillo.kr@gmail.com | AUTO-1772497528636-3p4xzr | Paquete de 8 clases - Wellnest Studio | $59.49 | 2026-03-03 |

## Last 5 rows
| Cliente | Email | Doc | Concepto | Monto | Fecha |
|---------|-------|-----|----------|-------|-------|
| Maru Merino | marumerino95@gmail.com | AUTO-1774897217803-ve0ruv | Paquete de 1 clases - Wellnest Studio | $15.00 | 2026-03-30 |
| Gracia Saravia | gracia.saravia17@gmail.com | AUTO-1774899702594-fu4bys | Paquete de 1 clases - Wellnest Studio | $15.00 | 2026-03-30 |
| Camila Romero | camilaromero11a@hotmail.com | AUTO-1774902535575-wq4kr9 | Paquete de 1 clases - Wellnest Studio | $15.00 | 2026-03-30 |
| Josseline Castillo  | joshyacl98@gmail.com | AUTO-1774920711845-cv9ubz | Paquete de 1 clases - Wellnest Studio | $15.00 | 2026-03-31 |
| Vanessa Herrera | vanessamakeup95@gmail.com | AUTO-1774276774812-syrxh5 | Paquete de 5 clases - Wellnest Studio | $65.00 | 2026-03-31 |

## Verification
- [x] Excel ordered by date ASC
- [x] All amounts from totalPagar (total con IVA)
- [x] ZIP contains 107 PDFs
- [x] Row count (107) matches DTE query count (107)
- [x] Total ($5097.72) = SUM of individual montos
- [x] Deduplicated by codigoGeneracion
