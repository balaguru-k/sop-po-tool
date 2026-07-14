#!/bin/bash
 
# Paths
TARGET_JAR=target/*.jar
CONFIG_JAR=config/
 
# Remove existing JAR files
if ls $CONFIG_JAR*.jar 1> /dev/null 2>&1; then
    rm $CONFIG_JAR*.jar
    echo "Deleted existing JAR file(s) in: $CONFIG_JAR"
else
    echo "No JAR files to delete in: $CONFIG_JAR"
fi
 
# Copy new JAR file
if ls $TARGET_JAR 1> /dev/null 2>&1; then
    cp $TARGET_JAR $CONFIG_JAR
    echo "Copied new JAR file(s) to: $CONFIG_JAR"
else
    echo "New JAR file(s) not found in: $TARGET_JAR"
fi