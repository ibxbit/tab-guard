# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup
- Comprehensive documentation
- Contributing guidelines
- License file

## [1.0.0] - 2024-01-01

### Added
- Core focus session functionality
- Site blocking during focus sessions
- Customizable timer (1 minute to several hours)
- 4-digit passcode protection
- Session statistics tracking
- Whitelist system for allowed websites
- Modern, responsive UI
- Chrome extension manifest v3 support
- Background service worker
- Popup interface with real-time countdown
- Blocked site page with focus reminder

### Features
- **Focus Session Management**: Start, stop, and monitor focus sessions
- **Site Blocking**: Automatically redirect to focus reminder page for blocked sites
- **Passcode Protection**: Secure sessions with customizable 4-digit passcode
- **Session Statistics**: Track total sessions and focused time
- **Whitelist System**: Allow specific websites during focus time
- **Real-time Countdown**: Visual timer showing remaining focus time
- **Responsive Design**: Clean, modern interface that works on different screen sizes

### Technical Details
- Built with vanilla JavaScript, HTML, and CSS
- Chrome Extension Manifest V3 compliant
- Service worker for background processing
- Local storage for session persistence
- Web navigation API for site blocking
- Modular code structure for maintainability

---

## Version History

- **1.0.0**: Initial release with core functionality 