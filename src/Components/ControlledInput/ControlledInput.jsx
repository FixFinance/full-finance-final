import React, { useEffect, useRef, useState } from 'react';

export const ControlledInput = (props) => {
   const { value, onChange, disabled, ...rest } = props;
   const [cursor, setCursor] = useState(null);
   const ref = useRef(null);

   useEffect(() => {
      const input = ref.current;
      let position = cursor >= value.length-4 ? value.length-4 : cursor;
      if (input) input.setSelectionRange(position, position);
   }, [ref, cursor, value]);

   const handleChange = (e) => {
      setCursor(e.target.selectionStart);
      onChange && onChange(e);
   };

   return <input ref={ref} value={value} disabled={disabled} onChange={handleChange} {...rest} />;
};
