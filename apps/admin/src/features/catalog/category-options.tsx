import type { Category } from '@shop/contracts';
import { useLocalize } from '../../lib/use-localize';

/**
 * `<option>`s for a category picker: each top-level category followed by its children
 * (indented). With `leavesOnly`, parents are shown as disabled group labels.
 */
export function CategoryOptions({
  categories,
  leavesOnly = false,
}: {
  categories: Category[];
  leavesOnly?: boolean;
}) {
  const localize = useLocalize();
  const roots = categories.filter((c) => !c.parentId);

  return (
    <>
      {roots.map((root) => {
        const children = categories.filter((c) => c.parentId === root.id);
        return [
          <option key={root.id} value={root.id} disabled={leavesOnly && children.length > 0}>
            {localize(root.name)}
          </option>,
          ...children.map((child) => (
            <option key={child.id} value={child.id}>
              {'   '}
              {localize(child.name)}
            </option>
          )),
        ];
      })}
    </>
  );
}
