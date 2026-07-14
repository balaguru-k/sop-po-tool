@echo off

REM Paths
set TARGET_JAR=target\*.jar
set CONFIG_JAR=config\*.jar

REM Remove existing JAR file
if exist "%CONFIG_JAR%" (
    del "%CONFIG_JAR%"
    echo Deleted existing JAR file: %CONFIG_JAR%
)

REM Copy new JAR file
if exist "%TARGET_JAR%" (
    copy "%TARGET_JAR%" "%CONFIG_JAR%"
    echo Copied new JAR file to: %CONFIG_JAR%
) else (
    echo New JAR file not found: %TARGET_JAR%
)
