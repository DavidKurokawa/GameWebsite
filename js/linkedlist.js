(function(context) {
    // doubly linked list
    context.DoublyLinkedList = function(arr) {
        // constructor: transform array to doubly linked list
        this.head = new context.Node();
        this.tail = new context.Node();
        var prev = this.head;
        arr.forEach(function(a) {
            var curr = new context.Node();
            curr.val = a;
            curr.val.node = curr;
            prev.next = curr;
            curr.prev = prev;
            prev = curr;
        });
        prev.next = this.tail;
        this.tail.prev = prev;

        // iterate over elements
        this.forEach = function(func) {
            var curr = this.head.next;
            while (curr != this.tail) {
                func(curr.val);
                curr = curr.next;
            }
        }
        
        // remove
        this.remove = function(node) {
            node.prev.next = node.next;
            node.next.prev = node.prev;
            node.prev = null;
            node.next = null;
        }

        // insert after
        this.insertAfter = function(prev, toInsert) {
            prev.next.prev = toInsert;
            toInsert.next = prev.next;
            prev.next = toInsert;
            toInsert.prev = prev;
        }

        // insert before
        this.insertBefore = function(toInsert, next) {
            next.prev.next = toInsert;
            toInsert.prev = next.prev;
            next.prev = toInsert;
            toInsert.next = next;
        }

        // move element to start
        this.moveToTail = function(node) {
            this.remove(node);
            this.insertBefore(node, this.tail);
        }
    };

    // node for doubly linked list
    context.Node = function() {
        this.prev;
        this.val;
        this.next;
    };
})(typeof exports === "undefined" ? document : exports);
