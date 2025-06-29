# Contributing to Tab Guard

Thank you for your interest in contributing to Tab Guard! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Bugs
- Use the GitHub issue tracker
- Include a clear description of the bug
- Provide steps to reproduce the issue
- Include your Chrome version and OS
- Add screenshots if relevant

### Suggesting Features
- Use the GitHub issue tracker
- Describe the feature in detail
- Explain why this feature would be useful
- Consider the impact on existing functionality

### Code Contributions
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Make your changes
4. Test thoroughly in Chrome
5. Commit your changes with clear commit messages
6. Push to your fork
7. Submit a pull request

## 🛠️ Development Setup

### Prerequisites
- Google Chrome browser
- Git
- Basic knowledge of HTML, CSS, and JavaScript

### Local Development
1. Clone your fork:
   ```bash
   git clone https://github.com/yourusername/tab-guard.git
   cd tab-guard
   ```

2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `tab-guard` folder

3. Make your changes and test them

4. Reload the extension when you make changes to the code

## 📝 Code Style Guidelines

### JavaScript
- Use ES6+ features when possible
- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent indentation (2 spaces)
- Use semicolons at the end of statements

### HTML
- Use semantic HTML elements
- Include proper accessibility attributes
- Keep the structure clean and organized

### CSS
- Use consistent naming conventions
- Organize styles logically
- Use CSS custom properties for theming
- Keep selectors specific but not overly complex

## 🧪 Testing

### Manual Testing Checklist
- [ ] Extension loads without errors
- [ ] Focus session starts correctly
- [ ] Site blocking works as expected
- [ ] Passcode protection functions properly
- [ ] Timer countdown works accurately
- [ ] Session statistics are tracked correctly
- [ ] UI is responsive and accessible
- [ ] No console errors in popup or background

### Testing Different Scenarios
- Test with various website types
- Test with different focus session durations
- Test passcode functionality
- Test session interruption and resumption
- Test on different Chrome versions

## 📋 Pull Request Guidelines

### Before Submitting
- Ensure all tests pass
- Update documentation if needed
- Check that your code follows the style guidelines
- Test on different Chrome versions if possible

### Pull Request Template
- Provide a clear description of changes
- Reference related issues
- Include screenshots for UI changes
- List any breaking changes
- Update version number if needed

## 🏷️ Version Management

### Version Format
We follow semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Updating Version
- Update version in `manifest.json`
- Update version in `README.md` if mentioned
- Create a release tag

## 🐛 Bug Reports

When reporting bugs, please include:
- Chrome version
- Operating system
- Steps to reproduce
- Expected behavior
- Actual behavior
- Console errors (if any)
- Screenshots (if relevant)

## 💡 Feature Requests

When suggesting features, please include:
- Detailed description of the feature
- Use cases and benefits
- Potential implementation approach
- Impact on existing functionality

## 📞 Getting Help

If you need help with contributing:
- Check existing issues and pull requests
- Review the documentation
- Ask questions in issues
- Join our community discussions

## 🙏 Recognition

Contributors will be recognized in:
- The README.md file
- Release notes
- GitHub contributors page

Thank you for contributing to Tab Guard! 🚀 