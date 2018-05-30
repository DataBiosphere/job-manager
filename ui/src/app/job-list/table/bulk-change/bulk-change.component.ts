import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material";
import {DisplayField} from "../../../shared/model/DisplayField";

@Component({
  selector: 'jm-bulk-change-component',
  templateUrl: 'bulk-change.component.html'
})
export class JobsBulkChangeComponent {
  constructor(
    public dialogRef: MatDialogRef<JobsBulkChangeComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  cancelChanges(): void {
    this.dialogRef.close();
  }

  getFieldType(df: DisplayField): string {
    return df.fieldType.toString();
  }

  getFieldOptions(df: DisplayField): string[] {
    return df.validFieldValues;
  }

  setFieldValue(df: DisplayField, value: string): void {
    this.data.newValues[df.field] = value;
  }

  clearFieldValue(df: DisplayField, field): void {
    field.value = '';
    this.setFieldValue(df, '');
  }

  saveChanges() {
    this.dialogRef.close({
      'fields': this.data.newValues,
      'jobs': this.data.selectedJobs
    });
  }
}
