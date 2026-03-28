import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ImagePreview from '../components/admin/ImagePreview/ImagePreview';

describe('ImagePreview', () => {
  it('renders image element for valid URL', () => {
    render(<ImagePreview url="https://picsum.photos/200" />);
    const img = screen.getByRole('img', { name: 'Preview' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://picsum.photos/200');
  });

  it('renders nothing when url is empty string', () => {
    const { container } = render(<ImagePreview url="" />);
    expect(container.firstChild).toBeNull();
  });
});
