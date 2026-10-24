import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs, TabsList, TabsPanel, TabsTrigger } from './Tabs';

const renderTabs = (props = {}) =>
  render(
    <Tabs defaultValue="one" {...props}>
      <TabsList aria-label="Sections">
        <TabsTrigger value="one">One</TabsTrigger>
        <TabsTrigger value="two">Two</TabsTrigger>
      </TabsList>
      <TabsPanel value="one">First panel</TabsPanel>
      <TabsPanel value="two">Second panel</TabsPanel>
    </Tabs>,
  );

describe('Tabs', () => {
  it('selects the default tab and shows its panel', () => {
    renderTabs();

    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel');
  });

  it('switches tabs and panels on click', async () => {
    const user = userEvent.setup();
    renderTabs();

    await user.click(screen.getByRole('tab', { name: 'Two' }));

    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Second panel');
  });

  it('wires aria-controls and aria-labelledby between tab and panel', () => {
    renderTabs();

    const tab = screen.getByRole('tab', { name: 'One' });
    const panel = document.getElementById(tab.getAttribute('aria-controls'));

    expect(panel).not.toBeNull();
    expect(panel).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('supports Arrow keys and Home/End', async () => {
    const user = userEvent.setup();
    renderTabs();

    const one = screen.getByRole('tab', { name: 'One' });
    const two = screen.getByRole('tab', { name: 'Two' });

    one.focus();
    await user.keyboard('{ArrowRight}');

    expect(two).toHaveAttribute('aria-selected', 'true');
    expect(two).toHaveFocus();

    await user.keyboard('{Home}');
    expect(one).toHaveAttribute('aria-selected', 'true');
    expect(one).toHaveFocus();

    await user.keyboard('{End}');
    expect(two).toHaveAttribute('aria-selected', 'true');
    expect(two).toHaveFocus();
  });

  it('skips disabled tabs when moving with the keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="one">
        <TabsList aria-label="Sections">
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two" disabled>
            Two
          </TabsTrigger>
          <TabsTrigger value="three">Three</TabsTrigger>
        </TabsList>
        <TabsPanel value="one">First panel</TabsPanel>
        <TabsPanel value="two">Second panel</TabsPanel>
        <TabsPanel value="three">Third panel</TabsPanel>
      </Tabs>,
    );

    screen.getByRole('tab', { name: 'One' }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Three' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Two' })).toBeDisabled();
  });

  it('does not change its own value when controlled', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderTabs({ defaultValue: undefined, value: 'one', onChange });

    await user.click(screen.getByRole('tab', { name: 'Two' }));

    expect(onChange).toHaveBeenCalledWith('two');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
  });
});
