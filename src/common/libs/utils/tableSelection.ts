/**
 * Handles checkbox click for table row selection (Rule 3)
 * 
 * Rule 3:
 * - If none checked: check the clicked checkbox
 * - If exactly 1 checked: check current new row's checkbox (add to selection)
 * - If multiple checked: toggle the clicked checkbox (add if not selected)
 * - If uncheck: always remove from selection (toggle off)
 * 
 * @param rowKey The unique key of the clicked row (as string)
 * @param checked Whether the checkbox is being checked or unchecked
 * @param selectedRowKeys Current array of selected row keys
 * @param setSelectedRowKeys Function to update selected row keys
 */
export function handleCheckboxClick(
  rowKey: string,
  checked: boolean,
  selectedRowKeys: readonly string[],
  setSelectedRowKeys: (keys: string[]) => void
): void {
  const key = String(rowKey);
  
  if (checked) {
    // Checkbox is being checked
    if (selectedRowKeys.length === 0) {
      // Rule 3: No checkbox checked: check the clicked checkbox
      setSelectedRowKeys([key]);
    } else if (!selectedRowKeys.includes(key)) {
      // Rule 3: If key not already selected, add it to selection
      // Applies to both "exactly 1 checked" and "multiple checked" cases
      setSelectedRowKeys([...selectedRowKeys, key]);
    }
  } else {
    // Rule 3: Uncheck: always remove from selection (toggle off)
    setSelectedRowKeys(selectedRowKeys.filter(k => k !== key));
  }
}

/**
 * Handles row click for table row selection (Rule 1 and 2)
 * 
 * Rule 1: If row is already checked, uncheck it
 * Rule 2: If another row is clicked (not checkbox)
 *   - If exactly 1 row selected: replace selection
 *   - If no selection: check current row
 *   - If multiple rows selected: do nothing
 * 
 * @param rowKey The unique key of the clicked row (as string)
 * @param selectedRowKeys Current array of selected row keys
 * @param setSelectedRowKeys Function to update selected row keys
 */
export function handleRowClick(
  rowKey: string,
  selectedRowKeys: readonly string[],
  setSelectedRowKeys: (keys: string[]) => void
): void {
  const key = String(rowKey);
  const isSelected = selectedRowKeys.includes(key);
  
  if (isSelected) {
    // Rule 1: If row is already checked, uncheck it
    setSelectedRowKeys(selectedRowKeys.filter(k => k !== key));
  } else if (selectedRowKeys.length <= 1) {
    // Rule 2: If another row is clicked (not checkbox)
    // If no selection or exactly 1 selected: check current row (replaces if 1 selected)
    setSelectedRowKeys([key]);
    // If multiple rows are selected, do nothing (Rule 2) - handled by condition
  }
}

