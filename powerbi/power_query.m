// Importa CSV en UTF-8 y conserva el punto decimal con en-US.


// ---- Parámetro: RutaDatos -------------------------------------------------------------------
// Carpeta absoluta powerbi\datos\, terminada en barra invertida.


// ---- dim_serie ------------------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "dim_serie.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"serie", type text}, {"grupo", type text}, {"orden", Int64.Type}, {"etiqueta", type text}}, "en-US")
in
    Tipos


// ---- dim_fecha ------------------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "dim_fecha.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"fecha", type date}, {"anio", Int64.Type}, {"trimestre_num", Int64.Type}, {"trimestre", type text}, {"mes_num", Int64.Type}, {"mes", type text}, {"mes_anio", type text}, {"conjunto", type text}, {"pandemia", type text}}, "en-US")
in
    Tipos


// ---- dim_modelo -----------------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "dim_modelo.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"modelo_id", type text}, {"modelo", type text}, {"rol", type text}, {"orden", Int64.Type}}, "en-US")
in
    Tipos


// ---- hechos_viajeros ------------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "hechos_viajeros.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"fecha", type date}, {"viajeros", type number}}, "en-US")
in
    Tipos


// ---- hechos_pronosticos ---------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "hechos_pronosticos.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"fecha", type date}, {"modelo_id", type text}, {"detalle", type text}, {"predicho", type number}, {"li", type number}, {"ls", type number}, {"error", type number}}, "en-US")
in
    Tipos


// ---- metricas_modelos -----------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "metricas_modelos.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"modelo_id", type text}, {"detalle", type text}, {"MAE", type number}, {"RMSE", type number}, {"MAE_pct_nivel", type number}, {"RMSE_pct_nivel", type number}, {"AIC", type number}, {"BIC", type number}, {"meses_evaluados", Int64.Type}, {"conjunto_evaluacion", type text}}, "en-US")
in
    Tipos


// ---- perdidas_lstm --------------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "perdidas_lstm.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"config", type text}, {"epoca", Int64.Type}, {"perdida_ajuste", type number}, {"perdida_validacion", type number}, {"mejor_epoca", Int64.Type}}, "en-US")
in
    Tipos


// ---- similitud_series -----------------------------------------------------------------------
let
    Origen = Csv.Document(File.Contents(RutaDatos & "similitud_series.csv"), [Delimiter = ",", Encoding = 65001, QuoteStyle = QuoteStyle.Csv]),
    Encabezados = Table.PromoteHeaders(Origen, [PromoteAllScalars = true]),
    Tipos = Table.TransformColumnTypes(Encabezados, {{"serie_id", type text}, {"PC1", type number}, {"PC2", type number}, {"grupo_kmedias", Int64.Type}, {"var_PC1", type number}, {"var_PC2", type number}}, "en-US")
in
    Tipos
