@echo off
echo ========================================
echo   PERMANENT FILE PROTECTION TOOL
echo ========================================
echo.

cd /d "c:\Users\USER\Desktop\Projects\PULL\RMD-GSU_IMS"

echo [1/5] Clearing Git cache...
git rm -r --cached . >nul 2>&1
echo     DONE

echo [2/5] Applying new .gitignore...
git add . >nul 2>&1
echo     DONE

echo [3/5] Committing changes...
git commit -m "chore: permanent cleanup" >nul 2>&1
echo     DONE

echo [4/5] Deleting junk files...
del /s /q *.log >nul 2>&1
del /s /q *test*.php >nul 2>&1
del /s /q *test*.html >nul 2>&1
echo     DONE

echo [5/5] Creating protection marker...
echo DO NOT DELETE - Protected > .cleanup-protected
echo     DONE

echo.
echo ========================================
echo   PROTECTION COMPLETE!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. CLOSE VS Code completely
echo 2. Re-open VS Code
echo 3. Files will NOT be restored!
echo.
echo Press any key to close...
pause >nul
