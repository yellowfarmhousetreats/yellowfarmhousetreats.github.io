Instructions for building the Windows Executable:

1. Install Python from python.org.
   IMPORTANT: During installation, make sure to check the box that says "Add Python to PATH".

2. Open this folder (Local-program) in File Explorer.

3. Double-click the "build_exe.bat" file.
   This script will:
   - Install the necessary libraries (PyQt6, PyInstaller).
   - Build the standalone executable.

4. Once the script finishes, look for a new folder named "dist".
   Inside "dist", you will find "ProductImageRenamer.exe". This is your standalone application.