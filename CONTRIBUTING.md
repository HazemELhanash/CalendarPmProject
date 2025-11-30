# 🤝 Contributing to CalendarFlow

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Report security issues privately
- No harassment or discrimination

## Getting Started

### Fork and Clone
```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/CalendarFlow.git
cd CalendarFlow
```

### Set Up Development Environment
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run type-check
```

## Development Guidelines

### Code Style
- Use TypeScript for all code
- Follow existing code patterns
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Component Structure
```tsx
import { useState } from 'react';

interface ComponentProps {
  prop1: string;
  prop2: number;
  onAction: (value: string) => void;
}

export default function Component({ prop1, prop2, onAction }: ComponentProps) {
  const [state, setState] = useState('');

  const handleClick = () => {
    onAction(state);
  };

  return <div>{prop1}</div>;
}
```

### Commit Messages
- Use clear, descriptive messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues when relevant

Examples:
```
Add project filtering feature
Fix: Correct date calculation in recurring events
Refactor: Simplify event service logic
docs: Update README with new features
```

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation
- `refactor/description` - Code refactoring

Example:
```bash
git checkout -b feature/task-dependencies
git checkout -b fix/recurring-event-bug
```

## Making Changes

### 1. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write clean, readable code
- Add comments for complex logic
- Test thoroughly

### 3. Commit Changes
```bash
git add .
git commit -m "Add: Description of changes"
```

### 4. Push to Fork
```bash
git push origin feature/your-feature-name
```

### 5. Create Pull Request
- Go to the original repository
- Click "New Pull Request"
- Select your branch
- Provide clear description of changes
- Link related issues

## Testing

### Manual Testing
1. Test in all calendar views (Month, Week, Day)
2. Test dark mode toggle
3. Test event creation and editing
4. Test drag and drop
5. Test filtering and search

### Browser Testing
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Documentation

### Update Documentation When:
- Adding new features
- Changing API
- Modifying configuration
- Fixing important bugs

### Document:
- What the feature does
- How to use it
- Code examples
- Configuration options

## Performance Considerations

- Use `React.memo` for memoization
- Implement `useMemo` for expensive computations
- Use `useCallback` for stable references
- Avoid unnecessary re-renders
- Profile with React DevTools

## File Structure

```
New components should go in:
- client/src/components/ (UI components)
- client/src/pages/ (Page components)
- client/src/lib/ (Utilities and services)
- client/src/hooks/ (Custom hooks)
```

## Pull Request Checklist

- [ ] Code follows style guidelines
- [ ] No unnecessary console logs
- [ ] TypeScript types are correct
- [ ] Components are memoized if needed
- [ ] Documentation updated
- [ ] Changes tested in all views
- [ ] Commit messages are clear
- [ ] No merge conflicts

## Types of Contributions

### 🐛 Bug Reports
- Describe the issue clearly
- Provide steps to reproduce
- Include screenshots/videos
- Specify browser and OS

### ✨ Feature Requests
- Describe the feature
- Explain use case
- Provide examples
- Consider mobile experience

### 📚 Documentation
- Fix typos
- Add examples
- Improve clarity
- Add missing sections

### ♿ Accessibility
- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader support

## Questions?

- Check existing issues
- Look at discussions
- Ask in pull request comments
- Create a discussion post

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [Git Guide](https://git-scm.com/book)

## Attribution

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to CalendarFlow! 🎉
