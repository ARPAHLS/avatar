; Custom NSIS strings — brand the wizard as "AVATAR Installer" instead of the
; default "... Setup" wording from productName.
!macro customHeader
  !define MUI_WELCOMEPAGE_TITLE "Welcome to the AVATAR Installer"
  !define MUI_WELCOMEPAGE_TEXT "This installer will guide you through installing AVATAR on your computer.$\r$\n$\r$\nClick Next to continue."
  !define MUI_FINISHPAGE_TITLE "AVATAR Installer complete"
  !define MUI_UNWELCOMEPAGE_TITLE "Uninstall AVATAR"
!macroend
