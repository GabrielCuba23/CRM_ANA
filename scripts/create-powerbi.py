from pathlib import Path
import json, uuid, zipfile

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'powerbi'
def write(name,content):
    p=OUT/name;p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(content,ensure_ascii=False,indent=2)+'\n' if isinstance(content,(dict,list)) else content,encoding='utf-8')
def uid():return str(uuid.uuid4())
SCHEMA={
'Resumen_KPIs':['Integrante_Equipo','Espacios_Asignados','Coordinaciones_Urgentes','Para_Visto_Bueno','Tareas_Pendientes','Tareas_Completadas','Porcentaje_Avance'],
'Agenda_Espacios':['ID_Espacio','Nombre_Contacto_o_Grupo','Cargo','Organo_Unidad','Oficina','Entidad','Correo','Anexo','Ubicacion','Telefono_WhatsApp','Codigo_CUT','Documento_Referencia','Estado_Gestion','Responsables_Equipo','Ultima_Actualizacion'],
'Tareas_y_CUTs':['ID_Tarea','Espacio_ID','Codigo_CUT','Contacto_Espacio','Organo','Descripcion_Tarea','Responsable','Autor','Fecha_Limite','Fecha_Hora_Limite','Estado','Texto_Origen','Tipo_Origen'],
'Bitacora_Historica':['ID_Nota','Espacio_ID','Fecha_Hora','Autor_Equipo','Contacto_Espacio','Codigo_CUT','Actualizacion_Registrada'],
'Reuniones_Acuerdos':['ID_Reunion','Espacio_ID','Tipo_Registro','Descripcion','Fecha_Hora_Fin','Fecha_Hora_Reunion','Titulo_Reunion','Contacto_Espacio','Codigo_CUT','Participantes','Enlace_Sala','Sala_Presencial','Estado_Reunion','Acuerdos_Pactados','Autor']}
write('CRM_ANA.pbip',{'version':'1.0','artifacts':[{'report':{'path':'CRM_ANA.Report'}}],'settings':{'enableAutoRecovery':True}})
write('CRM_ANA.Report/definition.pbir',{'version':'4.0','datasetReference':{'byPath':{'path':'../CRM_ANA.SemanticModel'}}})
write('CRM_ANA.SemanticModel/definition.pbism',{'version':'4.0','settings':{'qnaEnabled':False}})
write('CRM_ANA.SemanticModel/definition/database.tmdl','database CRM_ANA\n\tcompatibilityLevel: 1601\n\tcompatibilityMode: powerBI\n')
write('CRM_ANA.SemanticModel/definition/model.tmdl','model Model\n\tculture: es-PE\n\tdefaultPowerBIDataSourceVersion: powerBI_V3\n\tsourceQueryCulture: es-PE\n\tdataAccessOptions\n\t\tlegacyRedirects\n\t\treturnErrorValuesAsNull\n\nannotation __PBI_TimeIntelligenceEnabled = 0\n\n'+'\n'.join('ref table '+t for t in SCHEMA)+'\n')
write('CRM_ANA.SemanticModel/definition/expressions.tmdl','''expression pOrigen = "API" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true, List={"API", "Excel"}]

expression pBaseUrl = "https://crm-whatsapp-ana.pages.dev" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

expression pTeamToken = "" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=true]

expression pArchivoExcel = "" meta [IsParameterQuery=true, Type="Text", IsParameterQueryRequired=false]

expression FuenteAPI =
	if pOrigen = "Excel" then [] else
	if Text.Length(pTeamToken) < 24 then error "Configura pTeamToken en Transformar datos > Administrar parámetros." else
	Json.Document(Web.Contents(pBaseUrl, [RelativePath="api/powerbi", Headers=[#"X-Team-Token"=pTeamToken]]))

expression CargarTabla =
	(apiKey as text, campos as list, numeros as list, fechas as list, horas as list) as table =>
	let
		Origen = if pOrigen = "Excel" then
			if pArchivoExcel = "" then error "Configura pArchivoExcel con la ruta del reporte .xlsx." else
			Excel.Workbook(File.Contents(pArchivoExcel), null, true){[Item=apiKey, Kind="Table"]}[Data]
		else Table.FromRecords(Record.FieldOrDefault(FuenteAPI, apiKey, {}), campos, MissingField.UseNull),
		Columnas = Table.SelectColumns(Origen, campos, MissingField.UseNull),
		Filas = Table.SelectRows(Columnas, each Record.Field(_, campos{0}) <> null and Text.From(Record.Field(_, campos{0})) <> ""),
		Numeros = Table.TransformColumnTypes(Filas, List.Transform(numeros, each {_, Int64.Type}), "es-PE"),
		Fechas = Table.TransformColumns(Numeros, List.Transform(fechas, (c) => {c, (v) => if v = null or v = "" then null else Date.From(v), type nullable date})),
		Horas = Table.TransformColumns(Fechas, List.Transform(horas, (c) => {c, (v) => if v = null or v = "" then null else DateTimeZone.RemoveZone(DateTimeZone.SwitchZone(DateTimeZone.From(v), -5)), type nullable datetime})),
		Textos = Table.TransformColumnTypes(Horas, List.Transform(List.Difference(campos, List.Combine({numeros,fechas,horas})), each {_, type text}), "es-PE")
	in Textos
''')
MEASURES={
'Agenda_Espacios':{'Coordinaciones':'COUNTROWS(Agenda_Espacios)','Coordinaciones_activas':'CALCULATE(COUNTROWS(Agenda_Espacios), Agenda_Espacios[Estado_Gestion] <> "Cerrado")','Urgentes':'CALCULATE(COUNTROWS(Agenda_Espacios), Agenda_Espacios[Estado_Gestion] = "Urgente")'},
'Tareas_y_CUTs':{'Total_tareas':'COUNTROWS(Tareas_y_CUTs)','Tareas_pendientes':'CALCULATE(COUNTROWS(Tareas_y_CUTs), Tareas_y_CUTs[Estado] <> "Completado")','Tareas_completadas':'CALCULATE(COUNTROWS(Tareas_y_CUTs), Tareas_y_CUTs[Estado] = "Completado")','Avance':'DIVIDE([Tareas_completadas], [Total_tareas], 0)','Tareas_vencidas':'COUNTROWS(FILTER(Tareas_y_CUTs, Tareas_y_CUTs[Estado] <> "Completado" && NOT ISBLANK(Tareas_y_CUTs[Fecha_Limite]) && IF(ISBLANK(Tareas_y_CUTs[Fecha_Hora_Limite]), Tareas_y_CUTs[Fecha_Limite] + TIME(17,0,0), Tareas_y_CUTs[Fecha_Hora_Limite]) < UTCNOW() - TIME(5,0,0)))'},
'Reuniones_Acuerdos':{'Cantidad_reuniones':'COUNTROWS(Reuniones_Acuerdos)'},
'Resumen_KPIs':{'Carga_pendiente':'SUM(Resumen_KPIs[Tareas_Pendientes])'}}
for table,fields in SCHEMA.items():
    numbers=fields[1:] if table=='Resumen_KPIs' else []
    dates=[f for f in fields if f=='Fecha_Limite']
    hours=[f for f in fields if f in ['Fecha_Hora','Fecha_Hora_Reunion','Fecha_Hora_Fin','Fecha_Hora_Limite','Ultima_Actualizacion']]
    text='table '+table+'\n\tlineageTag: '+uid()+'\n\n'
    for name,formula in MEASURES.get(table,{}).items():
        text+='\tmeasure '+name+' = '+formula+'\n\t\tformatString: '+('0.0%' if name=='Avance' else '#,0')+'\n\t\tlineageTag: '+uid()+'\n\n'
    for f in fields:
        typ='int64' if f in numbers else 'dateTime' if f in dates+hours else 'string'
        text+=f'\tcolumn {f}\n\t\tdataType: {typ}\n\t\tlineageTag: {uid()}\n\t\tsourceColumn: {f}\n\t\tsummarizeBy: '+('sum' if f in numbers else 'none')+'\n'
        if f in dates+hours:text+='\t\tformatString: '+('yyyy-MM-dd' if f in dates else 'yyyy-MM-dd HH:mm')+'\n'
        text+='\n'
    ml=lambda values:'{'+', '.join('"'+v+'"' for v in values)+'}'
    text+=f'\tpartition {table} = m\n\t\tmode: import\n\t\tsource =\n\t\t\tCargarTabla("{table}", {ml(fields)}, {ml(numbers)}, {ml(dates)}, {ml(hours)})\n\n\tannotation PBI_ResultType = Table\n'
    write(f'CRM_ANA.SemanticModel/definition/tables/{table}.tmdl',text)
write('CRM_ANA.SemanticModel/definition/relationships.tmdl','\n'.join(f'relationship {uid()}\n\tfromColumn: {table}.Espacio_ID\n\ttoColumn: Agenda_Espacios.ID_Espacio\n' for table in ['Tareas_y_CUTs','Bitacora_Historica','Reuniones_Acuerdos']))
def literal(value):return {'expr':{'Literal':{'Value':"'"+value.replace("'","''")+"'"}}}
def visual(kind,fields,title,x,y,w,h):
    name=uuid.uuid4().hex[:20];entities=list(dict.fromkeys(t for t,f,m in fields));aliases={t:'t'+str(i) for i,t in enumerate(entities)}
    selects=[{('Measure' if m else 'Column'):{'Expression':{'SourceRef':{'Source':aliases[t]}},'Property':f},'Name':t+'.'+f,'NativeReferenceName':f} for t,f,m in fields]
    refs=[{'queryRef':t+'.'+f} for t,f,m in fields]
    roles={'Values':refs} if kind in ['card','tableEx','slicer'] else {'Category':[dict(refs[0],active=True)],'Y':[refs[1]]}
    config={'name':name,'layouts':[{'id':0,'position':{'x':x,'y':y,'z':1000,'width':w,'height':h,'tabOrder':1000}}],
    'singleVisual':{'visualType':kind,'projections':roles,'prototypeQuery':{'Version':2,'From':[{'Name':aliases[t],'Entity':t,'Type':0} for t in entities],'Select':selects},'drillFilterOtherVisuals':True,
    'vcObjects':{'title':[{'properties':{'show':{'expr':{'Literal':{'Value':'true'}}},'text':literal(title)}}]},
    'objects':{'dataPoint':[{'properties':{'defaultColor':{'solid':{'color':literal('#2957A4')}}}}]}}}
    return {'config':json.dumps(config,ensure_ascii=False,separators=(',',':')),'filters':'[]','height':h,'width':w,'x':x,'y':y,'z':1000}
def page(name,index,visuals):return {'config':'{}','displayName':name,'displayOption':1,'filters':'[]','height':720,'name':'ReportSection'+str(index),'ordinal':index,'visualContainers':visuals,'width':1280}
summary=[]
for i,(t,m,title) in enumerate([('Agenda_Espacios','Coordinaciones_activas','Coordinaciones activas'),('Tareas_y_CUTs','Tareas_pendientes','Tareas pendientes'),('Tareas_y_CUTs','Tareas_vencidas','Tareas vencidas'),('Tareas_y_CUTs','Avance','Avance de tareas')]):summary.append(visual('card',[(t,m,True)],title,20+i*315,20,300,120))
summary +=[visual('clusteredBarChart',[('Resumen_KPIs','Integrante_Equipo',False),('Resumen_KPIs','Carga_pendiente',True)],'Carga por integrante',20,160,600,270),visual('clusteredBarChart',[('Agenda_Espacios','Estado_Gestion',False),('Agenda_Espacios','Coordinaciones',True)],'Estados de coordinación',640,160,620,270),visual('tableEx',[('Resumen_KPIs',f,False) for f in SCHEMA['Resumen_KPIs']],'Resumen por operador',20,450,1240,240)]
pages=[page('Resumen ejecutivo',0,summary),
page('Tareas y CUT',1,[visual('slicer',[('Tareas_y_CUTs','Responsable',False)],'Responsable',20,20,240,170),visual('slicer',[('Tareas_y_CUTs','Estado',False)],'Estado',280,20,260,170),visual('tableEx',[('Tareas_y_CUTs',f,False) for f in ['Contacto_Espacio','Codigo_CUT','Descripcion_Tarea','Responsable','Fecha_Limite','Estado']],'Seguimiento de tareas',20,210,1240,480)]),
page('Directorio',2,[visual('slicer',[('Agenda_Espacios','Organo_Unidad',False)],'Órgano / Unidad',20,20,260,170),visual('tableEx',[('Agenda_Espacios',f,False) for f in ['Nombre_Contacto_o_Grupo','Cargo','Organo_Unidad','Oficina','Correo','Anexo','Codigo_CUT','Estado_Gestion','Responsables_Equipo']],'Agenda institucional',20,210,1240,480)]),
page('Reuniones',3,[visual('clusteredBarChart',[('Reuniones_Acuerdos','Estado_Reunion',False),('Reuniones_Acuerdos','Cantidad_reuniones',True)],'Estado de reuniones',20,20,600,230),visual('slicer',[('Reuniones_Acuerdos','Estado_Reunion',False)],'Filtrar reuniones',660,20,270,230),visual('tableEx',[('Reuniones_Acuerdos',f,False) for f in ['Fecha_Hora_Reunion','Titulo_Reunion','Contacto_Espacio','Participantes','Estado_Reunion','Acuerdos_Pactados']],'Reuniones y acuerdos',20,270,1240,420)]),
page('Bitácora',4,[visual('slicer',[('Bitacora_Historica','Autor_Equipo',False)],'Autor',20,20,270,170),visual('tableEx',[('Bitacora_Historica',f,False) for f in ['Fecha_Hora','Autor_Equipo','Contacto_Espacio','Codigo_CUT','Actualizacion_Registrada']],'Actualizaciones internas',20,210,1240,480)])]
base=OUT/'CRM_ANA.Report/StaticResources/SharedResources/BaseThemes/CY23SU04.json'
if not base.is_file():raise SystemExit('Falta el tema base conservado en powerbi/; restaura ese archivo antes de regenerar.')
write('CRM_ANA.Report/StaticResources/RegisteredResources/AnaTheme.json',{'name':'ANA Azul','dataColors':['#2957A4','#17345E','#6E94D0','#A9C0E5','#B84A3B','#D4A23B'],'background':'#FFFFFF','foreground':'#263B5C','tableAccent':'#2957A4'})
config={'version':'5.43','themeCollection':{'baseTheme':{'name':'CY23SU04','version':'5.43','type':2},'customTheme':{'name':'AnaTheme.json','version':'5.43','type':1}},'activeSectionIndex':0}
resources=[{'resourcePackage':{'disabled':False,'items':[{'name':'CY23SU04','path':'BaseThemes/CY23SU04.json','type':202}],'name':'SharedResources','type':2}},{'resourcePackage':{'disabled':False,'items':[{'name':'AnaTheme.json','path':'AnaTheme.json','type':201}],'name':'RegisteredResources','type':1}}]
write('CRM_ANA.Report/report.json',{'config':json.dumps(config,separators=(',',':')),'filters':'[]','layoutOptimization':0,'pods':[],'publicCustomVisuals':[],'resourcePackages':resources,'sections':pages,'theme':'AnaTheme.json'})
write('README.md','''# Proyecto Power BI · CRM ANA

Proyecto Power BI Desktop (.pbip), no archivo binario .pbix. Incluye cinco páginas, modelo TMDL, medidas DAX, relaciones y consultas Power Query para las cinco tablas del CRM. Se verifica la estructura localmente; su apertura y ejecución deben validarse en Power BI Desktop actual de Windows. Power BI Desktop no está disponible de forma nativa en macOS.

## Abrir y conectar

1. Extrae todo el ZIP en una carpeta de Windows fuera del repositorio Git. Mantén juntas las carpetas Report y SemanticModel.
2. Abre CRM_ANA.pbip con Power BI Desktop actualizado. Si tu versión lo requiere, habilita proyectos Power BI (.pbip) en Opciones > Características de versión preliminar.
3. En Transformar datos > Administrar parámetros selecciona pOrigen = API, verifica pBaseUrl y escribe el token real en pTeamToken.
4. Si Power BI solicita credenciales para la URL, usa acceso Anónimo: el token viaja en la cabecera X-Team-Token. Configura la privacidad de los orígenes según las reglas de tu organización.
5. Pulsa Cerrar y aplicar y después Actualizar. El modelo usa Importación: se actualiza al refrescar; no recibe una transmisión en tiempo real.
6. Puedes guardar el proyecto como .pbix desde Power BI Desktop.

## Usar Excel

Descarga un reporte .xlsx de esta versión del CRM, cambia pOrigen a Excel y pArchivoExcel a la ruta real del archivo. El modelo importa las cinco tablas estructuradas por nombre, sin mezclar las tablas dinámicas del resumen. Reemplaza el archivo y refresca para actualizar.

## Seguridad y compatibilidad

El proyecto no incluye tokens ni datos de contactos. Los parámetros vacíos son requisitos de conexión. Power BI guarda parámetros como texto: no subas a GitHub una copia con tu token. No uses Publicar en la web con datos institucionales. La actualización programada en Power BI Service depende de las credenciales, privacidad, licencia y gateway aplicables.

La estructura PBIP/PBIR-Legacy y el tema base siguen el ejemplo oficial de Microsoft Analysis-Services: https://github.com/microsoft/Analysis-Services/tree/master/pbidevmode/fabricps-pbip/SamplePBIP . Se conserva su licencia MIT en MICROSOFT-LICENSE.txt. El modelo, las consultas, medidas y páginas de ANA se generaron para este proyecto.
''')
public=ROOT/'public/powerbi';public.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(public/'CRM_ANA_PowerBI.pbip.zip','w',zipfile.ZIP_DEFLATED) as z:
    for path in OUT.rglob('*'):
        if path.is_file():z.write(path,'CRM_ANA_PowerBI/'+path.relative_to(OUT).as_posix())
print('Power BI: 5 tablas, 5 páginas, parámetros API/Excel y ZIP sin credenciales.')
