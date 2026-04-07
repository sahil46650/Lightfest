'use client';

/**
 * Attendee Information Form Component
 *
 * Form for a single attendee's information.
 */

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { attendeeInfoSchema, type AttendeeInfo } from '../schemas';

// ============================================================================
// Types
// ============================================================================

export interface AttendeeFormProps {
  /**
   * Unique key for this attendee (e.g., "ticketTypeId-index").
   */
  ticketKey: string;

  /**
   * Attendee number for display (1-indexed).
   */
  attendeeNumber: number;

  /**
   * Ticket type name for display.
   */
  ticketTypeName?: string;

  /**
   * Default values to pre-fill the form.
   */
  defaultValues?: Partial<AttendeeInfo>;

  /**
   * Callback when form values change.
   */
  onChange: (ticketKey: string, data: AttendeeInfo) => void;

  /**
   * Whether form fields should be disabled.
   */
  disabled?: boolean;

  /**
   * Whether to auto-save on blur.
   */
  autoSave?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function AttendeeForm({
  ticketKey,
  attendeeNumber,
  ticketTypeName,
  defaultValues,
  onChange,
  disabled = false,
  autoSave = true,
}: AttendeeFormProps) {
  const form = useForm<AttendeeInfo>({
    resolver: zodResolver(attendeeInfoSchema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      addOns: defaultValues?.addOns ?? [],
    },
  });

  // Auto-save on valid changes
  React.useEffect(() => {
    if (!autoSave) return;

    const subscription = form.watch((value, { type }) => {
      if (type === 'change') {
        const isValid = form.formState.isValid;
        if (isValid && value.name && value.email) {
          onChange(ticketKey, value as AttendeeInfo);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, ticketKey, onChange, autoSave]);

  // Handle blur to trigger validation and save
  const handleBlur = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        const values = form.getValues();
        onChange(ticketKey, values);
      }
    });
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-4">
        <h4 className="font-medium">
          Attendee {attendeeNumber}
          {ticketTypeName && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({ticketTypeName})
            </span>
          )}
        </h4>
      </div>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter attendee's full name"
                    disabled={disabled}
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      handleBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="attendee@example.com"
                    disabled={disabled}
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      handleBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>
    </div>
  );
}

// ============================================================================
// Attendee List Component
// ============================================================================

export interface AttendeeListFormProps {
  /**
   * List of ticket keys with their names.
   */
  tickets: Array<{
    key: string;
    typeName: string;
  }>;

  /**
   * Current attendee values.
   */
  attendees: Map<string, AttendeeInfo>;

  /**
   * Callback when any attendee changes.
   */
  onAttendeeChange: (ticketKey: string, data: AttendeeInfo) => void;

  /**
   * Default values for first attendee (from personal info).
   */
  primaryAttendeeDefaults?: Partial<AttendeeInfo>;

  /**
   * Whether forms are disabled.
   */
  disabled?: boolean;
}

export function AttendeeListForm({
  tickets,
  attendees,
  onAttendeeChange,
  primaryAttendeeDefaults,
  disabled = false,
}: AttendeeListFormProps) {
  return (
    <div className="space-y-4">
      {tickets.map((ticket, index) => (
        <AttendeeForm
          key={ticket.key}
          ticketKey={ticket.key}
          attendeeNumber={index + 1}
          ticketTypeName={ticket.typeName}
          defaultValues={
            index === 0 && primaryAttendeeDefaults
              ? { ...primaryAttendeeDefaults, ...attendees.get(ticket.key) }
              : attendees.get(ticket.key)
          }
          onChange={onAttendeeChange}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
