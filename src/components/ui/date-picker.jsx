import React from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './shadcn/button';
import { Input } from './shadcn/input';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const DatePicker = ({ 
  date, 
  onDateChange, 
  placeholder = "Selecciona una fecha",
  className,
  ...props 
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          {...props}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP", { locale: es }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Input
          type="date"
          value={date ? format(date, 'yyyy-MM-dd') : ''}
          onChange={(e) => {
            const selectedDate = e.target.value ? new Date(e.target.value) : null;
            onDateChange(selectedDate);
          }}
          className="border-0"
        />
      </PopoverContent>
    </Popover>
  );
};