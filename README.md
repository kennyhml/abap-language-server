## ABAP Language Server
An implementation of the [Language Server Protocol](https://microsoft.github.io/language-server-protocol/) for ABAP with a main focus on integrating nicely with Visual Studio Code.

The idea is to use the ABAP Development Tools only where needed and perform as much work as possible on the language server. Ideally, this means ADT should only be used to retrieve things such as objects,
source code, data definitions and table data. 
