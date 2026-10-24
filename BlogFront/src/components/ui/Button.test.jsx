import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type="button" so it cannot submit a form accidentally', () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'button');
  });

  it('honors an explicit submit type', () => {
    render(<Button type="submit">Save</Button>);

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('type', 'submit');
  });

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={onClick}>Save</Button>);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('exposes a busy state and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: /Save/ });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('Saving')).toBeInTheDocument();

    await user.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });
});
